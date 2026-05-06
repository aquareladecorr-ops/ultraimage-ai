import { NextResponse } from "next/server";

export async function GET() {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN!;

    // 1. Buscar dados do usuário/vendedor
    const userRes = await fetch("https://api.mercadopago.com/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
    const userData = await userRes.json();

    // 2. Buscar chaves PIX cadastradas
    const pixRes = await fetch("https://api.mercadopago.com/v1/pix-keys", {
          headers: { Authorization: `Bearer ${token}` },
        });
    const pixData = await pixRes.json();

    // 3. Criar uma preferência de teste e ver os payment_methods retornados
    const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
          body: JSON.stringify({
                  items: [{ title: "Teste PIX", quantity: 1, unit_price: 12.9, currency_id: "BRL" }],
                  payment_methods: { excluded_payment_types: [], excluded_payment_methods: [], installments: 1 },
                }),
        });
    const prefData = await prefRes.json();

    return NextResponse.json({
          user: {
                  id: userData.id,
                  email: userData.email,
                  status: userData.status,
                  tags: userData.tags,
                  site_status: userData.site_status,
                },
          pix_keys: pixData,
          preference_payment_methods: prefData.payment_methods,
          preference_id: prefData.id,
        });
  }
