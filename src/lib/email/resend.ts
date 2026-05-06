/**
 * Resend integration for transactional emails.
 * Templates kept inline (HTML) — for richer content, migrate to React Email.
 */

import { Resend } from "resend";

let _resend: Resend | null = null;
function client() {
  if (_resend) return _resend;
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = () => process.env.RESEND_FROM_EMAIL || "UltraImage <noreply@ultraimageai.com>";

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #0c0a08;
  color: #f5ede0;
  padding: 40px 24px;
`;

const wrapper = (content: string, title: string) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="${baseStyles}">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="margin-bottom: 32px;">
      <span style="font-size: 22px; font-weight: 600; letter-spacing: -0.02em;">
        ultraimage<span style="color: #d4a574;">.</span>ai
      </span>
    </div>
    ${content}
    <hr style="border: none; border-top: 1px solid #2a2520; margin: 40px 0 16px;" />
    <p style="font-size: 12px; color: #a39a8b; line-height: 1.6;">
      Você está recebendo este e-mail porque tem uma conta no UltraImage AI.<br />
      Dúvidas? Responda este e-mail ou fale no WhatsApp.
    </p>
  </div>
</body></html>
`;

export async function sendJobCompletedEmail(args: {
  to: string;
  jobId: string;
  resultUrl: string;
}) {
  const html = wrapper(
    `
    <h1 style="font-size: 28px; margin: 0 0 16px;">Sua imagem está pronta. ✦</h1>
    <p style="line-height: 1.6; color: #a39a8b;">
      Acabamos de processar sua foto. Você tem 7 dias para baixá-la.
    </p>
    <p style="margin: 32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/result/${args.jobId}"
         style="display: inline-block; background: #f5ede0; color: #0c0a08;
                padding: 14px 28px; text-decoration: none; font-weight: 500;">
        Ver e baixar →
      </a>
    </p>
  `,
    "Sua imagem está pronta"
  );

  return client().emails.send({
    from: FROM(),
    to: args.to,
    subject: "✦ Sua imagem está pronta — UltraImage AI",
    html,
  });
}

export async function sendJobFailedEmail(args: {
  to: string;
  jobId: string;
  reason: string;
}) {
  const html = wrapper(
    `
    <h1 style="font-size: 28px; margin: 0 0 16px;">Não conseguimos processar sua imagem.</h1>
    <p style="line-height: 1.6; color: #a39a8b;">
      Houve um problema técnico. Seus créditos foram <strong style="color: #d4a574;">devolvidos integralmente</strong> à sua conta.
    </p>
    <p style="line-height: 1.6; color: #a39a8b;">
      Detalhe técnico: <em>${args.reason}</em>
    </p>
    <p style="margin: 32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/upload"
         style="display: inline-block; background: #f5ede0; color: #0c0a08;
                padding: 14px 28px; text-decoration: none; font-weight: 500;">
        Tentar de novo →
      </a>
    </p>
  `,
    "Falha no processamento"
  );

  return client().emails.send({
    from: FROM(),
    to: args.to,
    subject: "Não conseguimos processar sua imagem",
    html,
  });
}

export async function sendPaymentApprovedEmail(args: {
  to: string;
  packageName: string;
  credits: number;
  amount: number;
}) {
  const html = wrapper(
    `
    <h1 style="font-size: 28px; margin: 0 0 16px;">Pagamento confirmado. ✦</h1>
    <p style="line-height: 1.6; color: #a39a8b;">
      Recebemos seu pagamento de <strong style="color: #f5ede0;">R$ ${args.amount.toFixed(2).replace(".", ",")}</strong>.
      Os <strong style="color: #d4a574;">${args.credits} créditos</strong> do pacote
      ${args.packageName} já estão na sua conta.
    </p>
    <p style="margin: 32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/upload"
         style="display: inline-block; background: #d4a574; color: #0c0a08;
                padding: 14px 28px; text-decoration: none; font-weight: 500;">
        Processar uma imagem →
      </a>
    </p>
  `,
    "Pagamento confirmado"
  );

  return client().emails.send({
    from: FROM(),
    to: args.to,
    subject: "✦ Pagamento confirmado — créditos liberados",
    html,
  });
}
