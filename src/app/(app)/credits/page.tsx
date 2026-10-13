import { createServer, createAdminClient } from "@/lib/supabase/server";
import { CreditsPanel } from "@/components/app/credits-panel";
import { BILLING_ENABLED } from "@/config/billing";

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; package?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServer();
  const admin = createAdminClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user!.id;

  if (!BILLING_ENABLED) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-20 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Acesso grátis</div>
        <h1 className="font-display text-4xl mb-5" style={{ fontWeight: 300 }}>Melhore imagens sem cobrança.</h1>
        <p className="text-bone-dim mb-8">O sistema de créditos e pagamentos está temporariamente desativado.</p>
        <a href="/upload" className="inline-block bg-bone text-ink px-6 py-3 hover:bg-copper transition">Processar imagem</a>
      </div>
    );
  }

  const [{ data: profile }, { data: payments }, { data: transactions }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("credits_available, total_credits_purchased")
        .eq("id", userId)
        .single(),
      admin
        .from("payments")
        .select(
          "id, package_name, credits_purchased, amount_brl, status, created_at, payment_method"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15),
      admin
        .from("credit_transactions")
        .select("type, amount, description, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
      <div className="mb-12">
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-3 font-mono">
          § Créditos
        </div>
        <h1
          className="font-display leading-[0.95] tracking-editorial"
          style={{ fontWeight: 300, fontSize: "clamp(36px, 5vw, 64px)" }}
        >
          Créditos & <em className="italic text-copper">compras</em>.
        </h1>
      </div>
      <CreditsPanel
        availableCredits={profile?.credits_available ?? 0}
        totalPurchased={profile?.total_credits_purchased ?? 0}
        paymentStatus={params.status ?? null}
        preSelectedPackageId={params.package ?? null}
        payments={payments ?? []}
        transactions={transactions ?? []}
      />
    </div>
  );
}
