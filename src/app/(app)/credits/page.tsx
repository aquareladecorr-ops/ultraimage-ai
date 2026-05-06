import { createServer } from "@/lib/supabase/server";
import { CreditsPanel } from "@/components/app/credits-panel";
import { unstable_noStore as noStore } from "next/cache";

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: { status?: string; package?: string };
}) {
  noStore();

  const supabase = createServer();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user!.id;

  const [{ data: profile }, { data: payments }, { data: transactions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("credits_available, total_credits_purchased")
        .eq("id", userId)
        .single(),
      supabase
        .from("payments")
        .select(
          "id, package_name, credits_purchased, amount_brl, status, created_at, payment_method"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
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
        paymentStatus={searchParams.status ?? null}
        preSelectedPackageId={searchParams.package ?? null}
        payments={payments ?? []}
        transactions={transactions ?? []}
      />
    </div>
  );
}
