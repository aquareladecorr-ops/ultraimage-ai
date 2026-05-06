-- ============================================================================
-- UltraImage AI — Initial Schema
-- ============================================================================
-- Tables: profiles, packages, credit_transactions, image_jobs, payments
-- Security: RLS enabled on all user-facing tables
-- Atomicity: stored procedures for credit reservation/commit/refund
-- ============================================================================

-- Required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES — extends auth.users with app data
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  credits_available integer not null default 5 check (credits_available >= 0),
  credits_reserved integer not null default 0 check (credits_reserved >= 0),
  total_credits_purchased integer not null default 0,
  total_credits_used integer not null default 0,
  plan_type text not null default 'free' check (plan_type in ('free','light','pro','business')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_email on public.profiles(email);

-- Auto-create profile on signup. New users get 5 free credits.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, credits_available)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    5
  );
  -- Log the welcome bonus
  insert into public.credit_transactions (user_id, type, amount, description)
  values (new.id, 'bonus', 5, 'Bônus de boas-vindas');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 2. PACKAGES — purchasable credit packs (avulsos + assinaturas)
-- ============================================================================
create table public.packages (
  id text primary key,
  name text not null,
  description text,
  kind text not null check (kind in ('one_time','subscription')),
  credits integer not null check (credits > 0),
  price_brl numeric(10,2) not null check (price_brl > 0),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Seed: avulsos
insert into public.packages (id, name, description, kind, credits, price_brl, is_featured, display_order) values
  ('avulso',       'Avulso',       'Para experimentar',     'one_time', 5,   12.90, false, 1),
  ('iniciante',    'Iniciante',    'Boa primeira compra',   'one_time', 25,  49.90, false, 2),
  ('essencial',    'Essencial',    'O preferido',           'one_time', 80,  129.00, true,  3),
  ('profissional', 'Profissional', 'Para fotógrafos',       'one_time', 250, 349.00, false, 4),
  ('estudio',      'Estúdio',      'Volume alto',           'one_time', 800, 899.00, false, 5);

-- Seed: assinaturas (futuro)
insert into public.packages (id, name, description, kind, credits, price_brl, is_featured, display_order) values
  ('plan_light',    'Light',    'Uso leve, sempre pronto', 'subscription', 30,  49.90,  false, 10),
  ('plan_pro',      'Pro',      'O equilíbrio ideal',      'subscription', 100, 129.00, true,  11),
  ('plan_business', 'Business', 'Equipes e gráficas',      'subscription', 400, 399.00, false, 12);

-- ============================================================================
-- 3. CREDIT_TRANSACTIONS — every credit movement, immutable ledger
-- ============================================================================
create table public.credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'purchase',     -- compra de pacote
    'consumption',  -- uso em processamento
    'reservation',  -- reserva (job pending)
    'release',      -- liberação de reserva (job failed/canceled)
    'refund',       -- reembolso explícito
    'bonus',        -- bônus de boas-vindas, promoção, etc.
    'manual_adjust' -- ajuste admin
  )),
  amount integer not null,  -- positive=credit, negative=debit
  balance_after integer not null,
  description text,
  reference_id uuid,        -- payment_id or job_id depending on type
  reference_type text,      -- 'payment' | 'image_job' | etc.
  created_at timestamptz not null default now()
);

create index idx_credit_tx_user on public.credit_transactions(user_id, created_at desc);
create index idx_credit_tx_ref on public.credit_transactions(reference_id) where reference_id is not null;

-- ============================================================================
-- 4. IMAGE_JOBS — every upscale request
-- ============================================================================
create table public.image_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- Input
  original_filename text,
  original_url text not null,
  original_size_bytes bigint,
  original_width integer,
  original_height integer,

  -- Configuration
  target_resolution_tier text not null,  -- e.g. '4k', '8k' — references credit tier
  credits_planned integer not null check (credits_planned > 0),
  credits_consumed integer,

  -- Output
  result_url text,
  result_width integer,
  result_height integer,
  processing_time_ms integer,

  -- Status & errors
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','canceled')),
  external_job_id text,  -- provider's job id (internal, never exposed)
  error_message text,
  error_code text,

  -- Lifecycle
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_jobs_user_recent on public.image_jobs(user_id, created_at desc);
create index idx_jobs_status on public.image_jobs(status) where status in ('pending','processing');
create index idx_jobs_external on public.image_jobs(external_job_id) where external_job_id is not null;
create index idx_jobs_expiring on public.image_jobs(expires_at) where status = 'completed';

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_jobs_updated before update on public.image_jobs
  for each row execute function public.set_updated_at();

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 5. PAYMENTS — Mercado Pago transactions
-- ============================================================================
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- Mercado Pago references
  mp_payment_id text unique,
  mp_preference_id text,
  mp_status text,  -- pending, approved, rejected, refunded, etc.

  -- Package info (snapshot at purchase time)
  package_id text not null references public.packages(id),
  package_name text not null,
  credits_purchased integer not null,
  amount_brl numeric(10,2) not null,
  payment_method text,  -- pix, credit_card, etc.

  -- Status
  status text not null default 'pending' check (status in ('pending','approved','rejected','refunded','canceled')),
  credited_at timestamptz,  -- when credits were actually added
  raw_payload jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_user on public.payments(user_id, created_at desc);
create index idx_payments_mp on public.payments(mp_payment_id) where mp_payment_id is not null;
create index idx_payments_status on public.payments(status);

create trigger trg_payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 6. ATOMIC CREDIT OPERATIONS (stored procedures)
-- ============================================================================
-- These functions ensure credit consistency under concurrent operations.
-- Always called from the API/server, never directly from the client.

-- Reserve credits for a job (deducts from available, adds to reserved)
create or replace function public.reserve_credits(
  p_user_id uuid,
  p_amount integer,
  p_job_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available integer;
begin
  if p_amount <= 0 then
    raise exception 'Reservation amount must be positive';
  end if;

  select credits_available into v_available
  from profiles where id = p_user_id for update;

  if v_available is null then
    raise exception 'User not found: %', p_user_id;
  end if;

  if v_available < p_amount then
    return false;  -- insufficient
  end if;

  update profiles
     set credits_available = credits_available - p_amount,
         credits_reserved  = credits_reserved + p_amount
   where id = p_user_id;

  insert into credit_transactions (user_id, type, amount, balance_after, description, reference_id, reference_type)
  values (p_user_id, 'reservation', -p_amount, v_available - p_amount,
          format('Reserva para job %s', p_job_id), p_job_id, 'image_job');

  return true;
end;
$$;

-- Commit the reservation (job succeeded — convert reserved to consumed)
create or replace function public.commit_credits(
  p_user_id uuid,
  p_amount integer,
  p_job_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  update profiles
     set credits_reserved   = credits_reserved - p_amount,
         total_credits_used = total_credits_used + p_amount
   where id = p_user_id
   returning credits_available into v_balance;

  insert into credit_transactions (user_id, type, amount, balance_after, description, reference_id, reference_type)
  values (p_user_id, 'consumption', -p_amount, v_balance,
          format('Processamento concluído (job %s)', p_job_id), p_job_id, 'image_job');
end;
$$;

-- Release the reservation (job failed — return credits to available)
create or replace function public.release_credits(
  p_user_id uuid,
  p_amount integer,
  p_job_id uuid,
  p_reason text default 'Falha no processamento'
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  update profiles
     set credits_available = credits_available + p_amount,
         credits_reserved  = credits_reserved - p_amount
   where id = p_user_id
   returning credits_available into v_balance;

  insert into credit_transactions (user_id, type, amount, balance_after, description, reference_id, reference_type)
  values (p_user_id, 'release', p_amount, v_balance, p_reason, p_job_id, 'image_job');
end;
$$;

-- Add credits from a payment
create or replace function public.add_credits_from_payment(
  p_user_id uuid,
  p_amount integer,
  p_payment_id uuid,
  p_description text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  update profiles
     set credits_available         = credits_available + p_amount,
         total_credits_purchased   = total_credits_purchased + p_amount
   where id = p_user_id
   returning credits_available into v_balance;

  insert into credit_transactions (user_id, type, amount, balance_after, description, reference_id, reference_type)
  values (p_user_id, 'purchase', p_amount, v_balance, p_description, p_payment_id, 'payment');
end;
$$;

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

-- Profiles: users can only read/update their own row
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_admin_all" on public.profiles
  for all using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Packages: public read
alter table public.packages enable row level security;

create policy "packages_public_read" on public.packages
  for select using (is_active = true);

create policy "packages_admin_all" on public.packages
  for all using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Credit transactions: users see only their own
alter table public.credit_transactions enable row level security;

create policy "credit_tx_select_own" on public.credit_transactions
  for select using (auth.uid() = user_id);

create policy "credit_tx_admin_all" on public.credit_transactions
  for all using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Image jobs: users see only their own
alter table public.image_jobs enable row level security;

create policy "jobs_select_own" on public.image_jobs
  for select using (auth.uid() = user_id);

create policy "jobs_insert_own" on public.image_jobs
  for insert with check (auth.uid() = user_id);

create policy "jobs_admin_all" on public.image_jobs
  for all using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Payments: users see only their own
alter table public.payments enable row level security;

create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

create policy "payments_admin_all" on public.payments
  for all using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- ============================================================================
-- 8. CLEANUP JOB (runs daily via Supabase pg_cron — set up separately)
-- ============================================================================
-- Marks expired jobs and clears their result URLs (storage cleanup happens in app code)
create or replace function public.expire_old_jobs()
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  update image_jobs
     set status = 'canceled',
         error_message = 'Imagem expirada (7 dias)'
   where status = 'completed'
     and expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
