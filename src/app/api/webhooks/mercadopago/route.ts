/**
 * POST /api/webhooks/mercadopago
 *
 * Receives notifications from Mercado Pago.
 * Idempotent: re-processing the same notification will not double-credit the user.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getMpPayment, mapMpStatus } from "@/lib/payments/mercadopago";
import { addCreditsFromPayment } from "@/lib/credits/transactions";
import { sendPaymentApprovedEmail } from "@/lib/email/resend";

export async function POST(req: Request) {
  let payload: { type?: string; data?: { id?: string | number } } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // We only care about `payment` events
  if (payload.type !== "payment" || !payload.data?.id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const mpPaymentId = String(payload.data.id);
  const admin = createAdminClient();

  try {
    // Fetch full payment from MP API (webhooks only contain id)
    const mp = await getMpPayment(mpPaymentId);
    const externalRef = mp.external_reference;
    if (!externalRef) {
      return NextResponse.json({ ok: false, reason: "missing_external_reference" }, { status: 400 });
    }

    const internalStatus = mapMpStatus(mp.status);

    // Find our pending payment record
    const { data: payment, error: findErr } = await admin
      .from("payments")
      .select("*")
      .eq("id", externalRef)
      .single();

    if (findErr || !payment) {
      return NextResponse.json({ ok: false, reason: "payment_not_found" }, { status: 404 });
    }

    // Idempotency: don't credit twice
    if (payment.status === "approved" && payment.credited_at) {
      return NextResponse.json({ ok: true, alreadyCredited: true });
    }

    // Update payment record
    await admin
      .from("payments")
      .update({
        mp_payment_id: mpPaymentId,
        mp_status: mp.status,
        status: internalStatus,
        payment_method: mp.payment_method_id ?? null,
        raw_payload: mp as unknown as Record<string, unknown>,
      })
      .eq("id", payment.id);

    // Credit user only on approved
    if (internalStatus === "approved") {
      await addCreditsFromPayment({
        userId: payment.user_id,
        amount: payment.credits_purchased,
        paymentId: payment.id,
        description: `Compra de ${payment.package_name} (${payment.credits_purchased} créditos)`,
      });

      await admin
        .from("payments")
        .update({ credited_at: new Date().toISOString() })
        .eq("id", payment.id);

      // Notify user
      const { data: profile } = await admin
        .from("profiles")
        .select("email")
        .eq("id", payment.user_id)
        .single();

      if (profile?.email) {
        sendPaymentApprovedEmail({
          to: profile.email,
          packageName: payment.package_name,
          credits: payment.credits_purchased,
          amount: Number(payment.amount_brl),
        }).catch(console.error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mercadopago webhook]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, info: "Mercado Pago webhook endpoint" });
}
