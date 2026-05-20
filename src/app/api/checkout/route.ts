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
                    console.error("[checkout] invalid_package:", parsed.data.packageId);
                        return NextResponse.json({ error: "invalid_package" }, { status: 400 });
                          }

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
                                                                                                                                console.error("[checkout] payment_create_failed:", payErr?.message, "pkg:", pkg.id);
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
                                                                                                                                                                                                      console.log("[checkout] ok pkg:", pkg.id, "amount:", pkg.priceBrl);
                                                                                                                                                                                                          return NextResponse.json({ url, paymentId: payment.id });
                                                                                                                                                                                                            } catch (err) {
                                                                                                                                                                                                                const msg = err instanceof Error ? err.message : String(err);
                                                                                                                                                                                                                    console.error("[checkout] MP error pkg:", pkg.id, "err:", msg);
                                                                                                                                                                                                                        await admin
                                                                                                                                                                                                                              .from("payments")
                                                                                                                                                                                                                                    .update({ status: "rejected", raw_payload: { error: msg } })
                                                                                                                                                                                                                                          .eq("id", payment.id);
                                                                                                                                                                                                                                              return NextResponse.json({ error: "checkout_failed", detail: msg }, { status: 500 });
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                }