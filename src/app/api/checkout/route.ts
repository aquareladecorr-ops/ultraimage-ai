/**
 * POST /api/checkout
 * Body: { packageId: string }
 *
 * Creates a payment record (status=pending) and a Mercado Pago preference.
 * Returns the URL the browser should redirect to.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createServer, createAdminClient } from "@/lib/supabase/server";
import { getPackageById } from "@/config/packages";
import { createCheckoutSession } from "@/lib/payments/mercadopago";

const BodySchema = z.object({ packageId: z.string().min(1) });

export async function POST(req: Request) {
  const supabase = createServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const pkg = getPackageById(parsed.data.packageId);
  if (!pkg || pkg.kind !== "one_time") {
    return NextResponse.json({ error: "invalid_package" }, { status: 400 });
  }

  // Persist a pending payment first so the webhook can correlate via external_reference
  const admin = createAdminClient();
  const { data: payment, error: payErr } = await admin
    .from("payments")
    .insert({
      user_id: auth.user.id,
      mp_payment_id: null,
      mp_preference_id: null,
      mp_status: null,
      package_id: pkg.id,
      package_name: pkg.name,
      credits_purchased: pkg.credits,
      amount_brl: pkg.priceBrl,
      payment_method: null,
      status: "pending",
      credited_at: null,
      raw_payload: null,
    })
    .select()
    .single();

  if (payErr || !payment) {
    return NextResponse.json({ error: "payment_create_failed", detail: payErr?.message }, { status: 500 });
  }

  try {
    const session = await createCheckoutSession({
      pkg,
      userId: auth.user.id,
      userEmail: auth.user.email!,
      internalPaymentId: payment.id,
    });

    await admin
      .from("payments")
      .update({ mp_preference_id: session.preferenceId })
      .eq("id", payment.id);

    const url = process.env.NODE_ENV === "production" ? session.initPoint : session.sandboxInitPoint;
    return NextResponse.json({ url, paymentId: payment.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "checkout_failed";
    await admin
      .from("payments")
      .update({ status: "rejected", raw_payload: { error: message } })
      .eq("id", payment.id);
    return NextResponse.json({ error: "checkout_failed", detail: message }, { status: 500 });
  }
}
