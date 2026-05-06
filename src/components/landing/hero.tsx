"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { BeforeAfter } from "./before-after";

export function Hero() {
  return (
    <section className="relative pt-32 md:pt-40 pb-24 md:pb-32 px-6 md:px-10 overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-copper/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-copper-deep/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative">
        <div className="flex items-center justify-between mb-12 md:mb-16 text-xs uppercase tracking-[0.2em] text-bone-dim font-mono">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-copper rounded-full animate-pulse" />
            Ultra Engine · v4.7
          </span>
          <span className="hidden sm:block">N° 001 — Edição Brasil</span>
          <span>↑ 64×</span>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-end mb-16">
          <h1
            className="md:col-span-9 font-display leading-[0.92] tracking-editorial"
            style={{ fontWeight: 300, fontSize: "clamp(48px, 9vw, 132px)", fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
          >
            Cada pixel,<br />
            <em className="italic text-copper" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
              em sua melhor{" "}
            </em>
            <br />
            versão.
          </h1>
          <p className="md:col-span-3 text-bone-dim text-base md:text-[17px] leading-relaxed border-l border-ink-line pl-5">
            Ampliação de imagens com IA premium. Resolução até{" "}
            <span className="text-bone">100 megapixels</span>, processamento em
            segundos, qualidade que sustenta impressão grande.
          </p>
        </div>

        {/* Badge acima do comparador */}
        <div className="mb-5 flex items-center gap-3">
          <span className="w-px h-4 bg-copper/60 flex-shrink-0" />
          <p className="text-sm font-mono text-bone-dim tracking-wide">
            Resultado com textura real —{" "}
            <span className="text-bone">sem aquele acabamento plástico que outros melhoradores deixam.</span>
          </p>
        </div>

        <BeforeAfter />

        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-3 bg-bone text-ink px-7 py-4 text-base font-medium hover:bg-copper transition-colors"
          >
            Melhorar minha foto agora
            <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <div className="flex items-center gap-6 text-sm text-bone-dim font-mono">
            <span>5 créditos grátis</span>
            <span className="w-px h-4 bg-ink-line" />
            <span>sem cartão</span>
            <span className="hidden sm:block w-px h-4 bg-ink-line" />
            <span className="hidden sm:block">Pix · Cartão</span>
          </div>
        </div>
      </div>
    </section>
  );
}
