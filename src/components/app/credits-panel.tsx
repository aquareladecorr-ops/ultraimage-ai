"use client";

import { useState, useEffect } from "react";
import { Check, AlertCircle, Clock } from "lucide-react";
import { ONE_TIME_PACKAGES, formatBrl } from "@/config/packages";
import { formatDate } from "@/lib/utils";

type Props = {
  availableCredits: number;
  totalPurchased: number;
  paymentStatus: string | null;
  preSelectedPackageId: string | null;
  payments: Array<{
    id: string;
    package_name: string;
    credits_purchased: number;
    amount_brl: number;
    status: string;
    created_at: string;
    payment_method: string | null;
  }>;
  transactions: Array<{
    type: string;
    amount: number;
    description: string | null;
    created_at: string;
  }>;
};

export function CreditsPanel({
  availableCredits,
  totalPurchased,
  paymentStatus,
  preSelectedPackageId,
  payments,
  transactions,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-trigger checkout if user came from landing with ?package=
  useEffect(() => {
    if (preSelectedPackageId && ONE_TIME_PACKAGES.find((p) => p.id === preSelectedPackageId)) {
      // Don't auto-redirect — show the pre-highlighted package, let user click
    }
  }, [preSelectedPackageId]);

  async function handleBuy(packageId: string) {
    setLoading(packageId);
    setError(null);
    try {
      const resp = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      if (!resp.ok) throw new Error("Falha ao iniciar compra");
      const { url } = await resp.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
      setLoading(null);
    }
  }

  return (
    <div>
      {/* Status banner from MP redirect */}
      {paymentStatus === "success" && (
        <div className="mb-8 border border-copper bg-copper/10 p-4 flex items-start gap-3">
          <Check size={18} className="text-copper mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <strong className="text-bone">Pagamento recebido.</strong>{" "}
            <span className="text-bone-dim">Os créditos serão liberados em instantes.</span>
          </div>
        </div>
      )}
      {paymentStatus === "pending" && (
        <div className="mb-8 border border-bone-dim bg-ink-deep p-4 flex items-start gap-3">
          <Clock size={18} className="text-bone-dim mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <strong className="text-bone">Pagamento pendente.</strong>{" "}
            <span className="text-bone-dim">Estamos aguardando confirmação do Mercado Pago.</span>
          </div>
        </div>
      )}
      {paymentStatus === "failure" && (
        <div className="mb-8 border border-copper-deep/40 bg-copper-deep/10 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-copper-deep mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <strong className="text-bone">Pagamento não concluído.</strong>{" "}
            <span className="text-bone-dim">Tente outro método ou outro cartão.</span>
          </div>
        </div>
      )}

      {/* Balance */}
      <div className="grid sm:grid-cols-2 gap-px bg-ink-line border border-ink-line mb-12">
        <div className="bg-ink-deep p-6 md:p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-bone-dim mb-2 font-mono">Saldo atual</div>
          <div className="font-display text-copper" style={{ fontWeight: 300, fontSize: "64px", lineHeight: 1 }}>
            {availableCredits}
          </div>
        </div>
        <div className="bg-ink-deep p-6 md:p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-bone-dim mb-2 font-mono">Total comprado</div>
          <div className="font-display" style={{ fontWeight: 300, fontSize: "64px", lineHeight: 1 }}>
            {totalPurchased}
          </div>
        </div>
      </div>

      {/* Package picker */}
      <div className="mb-16">
        <h2 className="font-display text-2xl mb-6" style={{ fontWeight: 400 }}>
          Comprar créditos
        </h2>

        {error && (
          <div className="mb-4 flex items-center gap-3 text-copper-deep border border-copper-deep/40 bg-copper-deep/10 p-3">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-ink-line border border-ink-line">
          {ONE_TIME_PACKAGES.map((pkg) => {
            const isPreselected = pkg.id === preSelectedPackageId;
            const isLoading = loading === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`relative bg-ink-deep p-6 transition ${
                  pkg.isFeatured || isPreselected ? "ring-1 ring-copper/40 bg-ink-card" : "hover:bg-ink-card"
                }`}
              >
                {pkg.isFeatured && (
                  <div className="absolute -top-px left-0 right-0 h-px bg-copper" />
                )}
                <div className="text-xs uppercase tracking-[0.2em] text-bone-dim mb-2 font-mono">{pkg.description}</div>
                <h3 className="font-display mb-4" style={{ fontWeight: 400, fontSize: "24px" }}>
                  {pkg.name}
                </h3>
                <div className="font-display mb-1" style={{ fontWeight: 300, fontSize: "36px", lineHeight: 1 }}>
                  {formatBrl(pkg.priceBrl)}
                </div>
                <div className="text-xs text-bone-dim mb-6 font-mono">{pkg.credits} créditos</div>
                <button
                  onClick={() => handleBuy(pkg.id)}
                  disabled={isLoading}
                  className={`w-full py-2.5 text-sm font-medium transition disabled:opacity-50 ${
                    pkg.isFeatured || isPreselected
                      ? "bg-copper text-ink hover:bg-bone"
                      : "border border-ink-line text-bone hover:border-copper"
                  }`}
                >
                  {isLoading ? "Abrindo..." : "Comprar"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-bone-dim font-mono mt-4">
          Pix · Cartão · Boleto · até 3x sem juros · NF-e disponível
        </p>
      </div>

      {/* History */}
      <div className="grid md:grid-cols-12 gap-12">
        <section className="md:col-span-7">
          <h2 className="font-display text-2xl mb-6" style={{ fontWeight: 400 }}>
            Pagamentos
          </h2>
          {payments.length === 0 ? (
            <p className="text-sm text-bone-dim">Nenhuma compra registrada ainda.</p>
          ) : (
            <div className="border border-ink-line">
              {payments.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-4 p-4 ${
                    i < payments.length - 1 ? "border-b border-ink-line" : ""
                  }`}
                >
                  <div>
                    <div className="text-bone text-sm">{p.package_name}</div>
                    <div className="text-xs text-bone-dim font-mono mt-0.5">
                      {p.credits_purchased} créditos · {formatDate(p.created_at)}
                      {p.payment_method && ` · ${p.payment_method}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-bone text-sm font-mono">{formatBrl(Number(p.amount_brl))}</div>
                    <PaymentStatus status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="md:col-span-5">
          <h2 className="font-display text-2xl mb-6" style={{ fontWeight: 400 }}>
            Movimentação
          </h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-bone-dim">Sem movimentação.</p>
          ) : (
            <ul className="space-y-3">
              {transactions.map((tx, i) => (
                <li key={i} className="flex items-start justify-between gap-3 text-sm border-b border-ink-line pb-3">
                  <div className="min-w-0">
                    <div className="text-bone truncate">{tx.description ?? tx.type}</div>
                    <div className="text-xs text-bone-dim font-mono mt-0.5">{formatDate(tx.created_at)}</div>
                  </div>
                  <span className={`font-mono text-sm flex-shrink-0 ${tx.amount > 0 ? "text-copper" : "text-bone-dim"}`}>
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function PaymentStatus({ status }: { status: string }) {
  const labels: Record<string, { text: string; color: string }> = {
    approved: { text: "aprovado", color: "text-copper" },
    pending: { text: "pendente", color: "text-bone-dim" },
    rejected: { text: "rejeitado", color: "text-copper-deep" },
    refunded: { text: "reembolsado", color: "text-bone-dim" },
    canceled: { text: "cancelado", color: "text-bone-dim" },
  };
  const cfg = labels[status] ?? { text: status, color: "text-bone-dim" };
  return <span className={`text-xs uppercase tracking-[0.15em] font-mono ${cfg.color}`}>{cfg.text}</span>;
}
