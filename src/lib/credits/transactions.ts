/**
 * Credit operations.
 *
 * SAFETY MODEL:
 * 1. RESERVE: when a job is created, credits move from `available` to `reserved`.
 * 2. COMMIT:  when the job completes, reserved credits are consumed.
 * 3. RELEASE: when the job fails/cancels, reserved credits return to available.
 *
 * All operations go through Postgres stored procedures (see migration 001)
 * which acquire row locks and write atomic ledger entries.
 *
 * NEVER bypass these functions. Direct UPDATE on profiles.credits_* will
 * desynchronize the ledger.
 */

import { createAdminClient } from "@/lib/supabase/server";

export class InsufficientCreditsError extends Error {
  constructor(public required: number, public available: number) {
    super(`Créditos insuficientes: precisa de ${required}, tem ${available}`);
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Reserve credits for a pending job.
 * Returns true on success, throws InsufficientCreditsError if balance too low.
 */
export async function reserveCredits(args: {
  userId: string;
  amount: number;
  jobId: string;
}): Promise<void> {
  const sb = createAdminClient();

  // First check available balance for a clean error message
  const { data: profile, error: profileErr } = await sb
    .from("profiles")
    .select("credits_available")
    .eq("id", args.userId)
    .single();

  if (profileErr || !profile) {
    throw new Error(`Profile not found: ${args.userId}`);
  }

  if (profile.credits_available < args.amount) {
    throw new InsufficientCreditsError(args.amount, profile.credits_available);
  }

  const { data, error } = await sb.rpc("reserve_credits", {
    p_user_id: args.userId,
    p_amount: args.amount,
    p_job_id: args.jobId,
  });

  if (error) throw new Error(`reserve_credits failed: ${error.message}`);
  if (data === false) {
    // race condition — balance dropped between our check and the RPC call
    const fresh = await sb
      .from("profiles")
      .select("credits_available")
      .eq("id", args.userId)
      .single();
    throw new InsufficientCreditsError(args.amount, fresh.data?.credits_available ?? 0);
  }
}

export async function commitCredits(args: {
  userId: string;
  amount: number;
  jobId: string;
}): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.rpc("commit_credits", {
    p_user_id: args.userId,
    p_amount: args.amount,
    p_job_id: args.jobId,
  });
  if (error) throw new Error(`commit_credits failed: ${error.message}`);
}

export async function releaseCredits(args: {
  userId: string;
  amount: number;
  jobId: string;
  reason?: string;
}): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.rpc("release_credits", {
    p_user_id: args.userId,
    p_amount: args.amount,
    p_job_id: args.jobId,
    p_reason: args.reason ?? "Falha no processamento",
  });
  if (error) throw new Error(`release_credits failed: ${error.message}`);
}

export async function addCreditsFromPayment(args: {
  userId: string;
  amount: number;
  paymentId: string;
  description: string;
}): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb.rpc("add_credits_from_payment", {
    p_user_id: args.userId,
    p_amount: args.amount,
    p_payment_id: args.paymentId,
    p_description: args.description,
  });
  if (error) throw new Error(`add_credits_from_payment failed: ${error.message}`);
}
