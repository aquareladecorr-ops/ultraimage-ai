"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ONE_TIME_PACKAGES, SUBSCRIPTION_PACKAGES, formatBrl, type Package } from "@/config/packages";
import { RESOLUTION_TIERS } from "@/config/credits";
import Link from "next/link";

export function Pricing() {
  const [tab, setTab] = useState<"avulso" | "mensal">("avulso");
  const data: readonly Package[] = tab === "avulso" ? ONE_TIME_PACKAGES : SUBSCRIPTION_PACKAGES;

  return (
    <section id="planos" className="py-32 md:py-40 px-6 md:px-10">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-16">
          <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Investimento</div>
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <h2 className="md:col-span-7 font-display leading-[0.95] tracking-editorial" style={{ fontWeight: 300, fontSize: "clamp(40px, 5vw, 72px)" }}>
              Pague pelo que <em className="italic text-copper">usar</em>.<br />
              Sem surpresas.
            </h2>
            <div className="md:col-span-4 md:col-start-9">
              <div className="inline-flex border border-ink-line p-1 bg-ink-deep">
                <button onClick={() => setTab("avulso")} className={`px-5 py-2.5 text-sm transition-colors ${tab === "avulso" ? "bg-bone text-ink" : "text-bone-dim hover:text-bone"}`}>
                  Avulso
                </button>
                <button onClick={() => setTab("mensal")} className={`px-5 py-2.5 text-sm transition-colors ${tab === "mensal" ? "bg-bone text-ink" : "text-bone-dim hover:text-bone"}`}>
                  Mensal
                </button>
              </div>
              <p className="text-xs text-bone-dim mt-3 font-mono">
                {tab === "avulso" ? "Compra única · créditos válidos por 12 meses" : "Renovação automática · cancele a qualquer momento"}
              </p>
            </div>
          </div>
        </div>

        <div className={`grid gap-px bg-ink-line ${tab === "avulso" ? "md:grid-cols-5" : "md:grid-cols-3"}`}>
          {data.map((p) => (
            <div
              key={p.id}
              className={`relative p-7 md:p-8 transition-all ${
                p.isFeatured ? "bg-ink-card md:scale-[1.02] md:z-10 ring-1 ring-copper/40" : "bg-ink hover:bg-ink-card"
              }`}
            >
              {p.isFeatured && <div className="absolute -top-px left-0 right-0 h-px bg-copper" />}
              {p.isFeatured && (
                <div className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.25em] text-copper font-mono">★ recomendado</div>
              )}
              <div className="text-xs uppercase tracking-[0.25em] text-bone-dim mb-2 font-mono">{p.description}</div>
              <h3 className="mb-6 font-display" style={{ fontWeight: 400, fontSize: "32px", lineHeight: 1 }}>
                {p.name}
              </h3>
              <div className="mb-1 font-display" style={{ fontWeight: 300, fontSize: "44px", lineHeight: 1 }}>
                {formatBrl(p.priceBrl)}
              </div>
              <div className="text-sm text-bone-dim mb-8 font-mono">
                {p.kind === "subscription" ? `${p.credits} créditos / mês` : `${p.credits} créditos`}
              </div>
              <Link
                href={`/credits?package=${p.id}`}
                className={`block text-center w-full py-3 text-sm font-medium transition-colors ${
                  p.isFeatured ? "bg-copper text-ink hover:bg-bone" : "bg-transparent border border-ink-line text-bone hover:border-copper"
                }`}
              >
                Comprar
              </Link>
              <div className="mt-6 space-y-2 text-xs text-bone-dim">
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-copper" /> Pix · Cartão · Boleto
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-copper" /> Suporte humano
                </div>
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-copper" /> NF-e disponível
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Credits consumption table — derived from RESOLUTION_TIERS */}
        <div className="mt-16 border border-ink-line p-8 md:p-10 bg-ink-deep">
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs uppercase tracking-[0.3em] text-copper font-mono">Tabela de consumo</div>
            <span className="text-xs text-bone-dim font-mono">créditos por imagem</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-ink-line">
            {RESOLUTION_TIERS.map((t) => (
              <div key={t.id} className="bg-ink-deep p-4 text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-bone-dim font-mono">{t.label}</div>
                <div className="mt-2 font-display" style={{ fontWeight: 300, fontSize: "32px", lineHeight: 1 }}>
                  {t.credits}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
