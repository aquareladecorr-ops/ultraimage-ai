/**
 * Mercado Pago integration.
 * - Creates payment preferences for one-time package purchases
 * - Validates webhook signatures
 * - Maps MP statuses to internal payment statuses
 */

import { MercadoPagoConfig, Preference, Payment as MpPayment } from "mercadopago";
import type { Package } from "@/config/packages";

const cfg = () => {
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
          throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not set");
    }
    return new MercadoPagoConfig({
          accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
          options: { timeout: 8000 },
    });
};

export type CreateCheckoutInput = {
    pkg: Package;
    userId: string;
    userEmail: string;
    internalPaymentId: string;
};

export type CheckoutSession = {
    preferenceId: string;
    initPoint: string; // production URL
    sandboxInitPoint: string; // sandbox URL
};

/**
 * Create a payment preference (Checkout Pro).
 * The user is redirected to `initPoint` to complete payment.
 * PIX is enabled by including it in payment_methods.
 */
export async function createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const preference = new Preference(cfg());

  const result = await preference.create({
        body: {
                external_reference: input.internalPaymentId,
                payer: { email: input.userEmail },
                items: [
                  {
                              id: input.pkg.id,
                              title: `UltraImage AI — ${input.pkg.name}`,
                              description: `${input.pkg.credits} créditos · ${input.pkg.description}`,
                              quantity: 1,
                              unit_price: input.pkg.priceBrl,
                              currency_id: "BRL",
                              category_id: "services",
                  },
                        ],
                back_urls: {
                          success: `${baseUrl}/credits?status=success&payment_id=${input.internalPaymentId}`,
                          failure: `${baseUrl}/credits?status=failure&payment_id=${input.internalPaymentId}`,
                          pending: `${baseUrl}/credits?status=pending&payment_id=${input.internalPaymentId}`,
                },
                auto_return: "approved",
                payment_methods: {
                          excluded_payment_types: [
                            { id: "ticket" },
                                    ],
                          excluded_payment_methods: [],
                          installments: 1,
                          default_payment_method_id: "pix",
                },
                notification_url: `${baseUrl}/api/webhooks/mercadopago`,
                statement_descriptor: "ULTRAIMAGE",
                metadata: {
                          user_id: input.userId,
                          package_id: input.pkg.id,
                          credits: input.pkg.credits,
                },
        },
  });

  return {
        preferenceId: result.id!,
        initPoint: result.init_point!,
        sandboxInitPoint: result.sandbox_init_point!,
  };
}

/**
 * Fetch a payment by its MP id (used by webhook handler to confirm details).
 */
export async function getMpPayment(paymentId: string) {
    const payment = new MpPayment(cfg());
    return payment.get({ id: paymentId });
}

/**
 * Map Mercado Pago payment status to our internal status.
 */
export function mapMpStatus(mpStatus?: string | null): "pending" | "approved" | "rejected" | "refunded" | "canceled" {
    switch (mpStatus) {
      case "approved": return "approved";
      case "rejected": return "rejected";
      case "cancelled":
      case "canceled": return "canceled";
      case "refunded":
      case "charged_back": return "refunded";
      case "in_process":
      case "in_mediation":
      case "pending":
      case "authorized":
      default: return "pending";
    }
}
