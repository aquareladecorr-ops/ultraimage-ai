-- Private, outbound-only worker queue for the local GPU agent.
-- Run once in Supabase SQL Editor before deploying the application.
alter table public.image_jobs
  add column if not exists processing_backend text not null default 'replicate'
    check (processing_backend in ('replicate', 'local')),
  add column if not exists worker_id text,
  add column if not exists worker_claim_token_hash text,
  add column if not exists worker_lease_expires_at timestamptz,
  add column if not exists worker_attempts integer not null default 0
    check (worker_attempts >= 0);

create index if not exists idx_image_jobs_local_queue
  on public.image_jobs (created_at)
  where processing_backend = 'local' and status in ('pending', 'processing');

create or replace function public.claim_local_image_job(
  p_worker_id text,
  p_claim_token text,
  p_lease_seconds integer default 7200
)
returns table (
  job_id uuid, user_id uuid, original_url text,
  original_width integer, original_height integer,
  target_resolution_tier text, original_filename text
)
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_job public.image_jobs%rowtype;
begin
  if p_worker_id is null or length(p_worker_id) not between 1 and 100
     or p_claim_token is null or length(p_claim_token) < 32
     or p_lease_seconds is null or p_lease_seconds not between 60 and 7200 then
    raise exception 'Invalid worker claim';
  end if;

  loop
    select * into v_job
      from public.image_jobs j
     where j.processing_backend = 'local'
       and (j.status = 'pending'
         or (j.status = 'processing' and j.worker_lease_expires_at < now()))
     order by j.created_at
     limit 1
     for update skip locked;
    if not found then return; end if;

    if v_job.worker_attempts >= 3 then
      perform public.release_credits(v_job.user_id, v_job.credits_planned, v_job.id,
        'Reserva liberada após falhas repetidas do agente local');
      update public.image_jobs
         set status = 'failed', error_code = 'LOCAL_WORKER_RETRIES_EXHAUSTED',
             error_message = 'O processamento local excedeu o limite de tentativas.',
             worker_id = null, worker_claim_token_hash = null,
             worker_lease_expires_at = null
       where id = v_job.id;
      continue;
    end if;

    update public.image_jobs
       set status = 'processing', worker_id = p_worker_id,
           worker_claim_token_hash = encode(digest(p_claim_token, 'sha256'), 'hex'),
           worker_lease_expires_at = now() + make_interval(secs => p_lease_seconds),
           worker_attempts = worker_attempts + 1
     where id = v_job.id;
    return query select v_job.id, v_job.user_id, v_job.original_url,
      v_job.original_width, v_job.original_height,
      v_job.target_resolution_tier, v_job.original_filename;
    return;
  end loop;
end;
$$;

create or replace function public.complete_local_image_job(
  p_job_id uuid, p_claim_token text, p_result_key text,
  p_result_width integer, p_result_height integer, p_processing_time_ms integer
)
returns boolean language plpgsql security definer
set search_path = public, extensions
as $$
declare v_job public.image_jobs%rowtype;
begin
  if p_claim_token is null or length(p_claim_token) < 32
     or p_result_key is null or p_result_width is null or p_result_width <= 0
     or p_result_height is null or p_result_height <= 0
     or p_processing_time_ms is null or p_processing_time_ms < 0 then return false; end if;
  select * into v_job from public.image_jobs
   where id = p_job_id and processing_backend = 'local'
     and worker_claim_token_hash = encode(digest(p_claim_token, 'sha256'), 'hex')
   for update;
  if not found then return false; end if;
  if v_job.status = 'completed' and v_job.result_url = p_result_key
     and v_job.result_width = p_result_width and v_job.result_height = p_result_height then
    return true;
  end if;
  if v_job.status <> 'processing' or v_job.worker_lease_expires_at <= now()
     or left(p_result_key, length('users/' || v_job.user_id::text || '/result/'))
        <> 'users/' || v_job.user_id::text || '/result/' then
    return false;
  end if;
  perform public.commit_credits(v_job.user_id, v_job.credits_planned, v_job.id);
  update public.image_jobs
     set status = 'completed', result_url = p_result_key,
         result_width = p_result_width, result_height = p_result_height,
         credits_consumed = credits_planned, processing_time_ms = p_processing_time_ms,
         completed_at = now(), error_code = null, error_message = null,
         worker_id = null, worker_lease_expires_at = null
   where id = v_job.id;
  return true;
end;
$$;

create or replace function public.fail_local_image_job(
  p_job_id uuid, p_claim_token text, p_error_code text, p_error_message text
)
returns boolean language plpgsql security definer
set search_path = public, extensions
as $$
declare v_job public.image_jobs%rowtype;
begin
  if p_claim_token is null or length(p_claim_token) < 32 then return false; end if;
  select * into v_job from public.image_jobs
   where id = p_job_id and processing_backend = 'local'
     and status = 'processing'
     and worker_claim_token_hash = encode(digest(p_claim_token, 'sha256'), 'hex')
   for update;
  if not found then return false; end if;
  perform public.release_credits(v_job.user_id, v_job.credits_planned, v_job.id,
    left(coalesce(p_error_message, 'Falha no processamento local'), 500));
  update public.image_jobs
     set status = 'failed', error_code = left(coalesce(p_error_code, 'LOCAL_WORKER_FAILED'), 80),
         error_message = left(coalesce(p_error_message, 'Falha no processamento local'), 500),
         worker_id = null, worker_claim_token_hash = null, worker_lease_expires_at = null
   where id = v_job.id;
  return true;
end;
$$;

revoke all on function public.claim_local_image_job(text, text, integer) from public, anon, authenticated;
revoke all on function public.complete_local_image_job(uuid, text, text, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.fail_local_image_job(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.claim_local_image_job(text, text, integer) to service_role;
grant execute on function public.complete_local_image_job(uuid, text, text, integer, integer, integer) to service_role;
grant execute on function public.fail_local_image_job(uuid, text, text, text) to service_role;
