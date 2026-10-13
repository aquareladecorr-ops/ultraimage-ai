import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

export function Pricing() {
  return (
    <section id="planos" className="py-28 md:py-36 px-6 md:px-10 bg-ink-deep border-y border-ink-line">
      <div className="max-w-4xl mx-auto text-center">
        <Sparkles size={24} className="mx-auto text-copper mb-6" />
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Acesso aberto</div>
        <h2 className="font-display leading-[0.95] tracking-editorial mb-6" style={{ fontWeight: 300, fontSize: "clamp(40px, 6vw, 76px)" }}>
          Melhore suas fotos <em className="italic text-copper">grátis</em>.
        </h2>
        <p className="max-w-2xl mx-auto text-bone-dim text-lg leading-relaxed mb-10">
          Estamos liberando o UltraImage para melhorias enquanto aprimoramos o serviço. Nesta fase, o processamento é feito pelo agente local conectado ao projeto.
        </p>
        <Link href="/signup" className="inline-flex items-center gap-3 bg-bone text-ink px-7 py-4 font-medium hover:bg-copper transition">
          Criar conta e começar <ArrowUpRight size={16} />
        </Link>
        <p className="text-xs text-bone-dim font-mono mt-5">Sem compra ou pagamento durante esta fase.</p>
      </div>
    </section>
  );
}
