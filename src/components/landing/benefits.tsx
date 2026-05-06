import { Aperture, Layers, Zap, ShieldCheck, Headphones, Sparkles } from "lucide-react";

export function Benefits() {
  const items = [
    { icon: Aperture, t: "IA treinada para fotografia", d: "Modelo treinado em milhões de fotografias reais. Preserva grão, pele, textura — sem o aspecto plástico de IA genérica." },
    { icon: Layers, t: "Até 100 megapixels", d: "Saída até 10000×10000. Suficiente para canvas de 2 metros, álbuns premium e impressão offset." },
    { icon: Zap, t: "15 segundos por foto", d: "GPU dedicada. Sem fila quando você é assinante Pro ou Business." },
    { icon: ShieldCheck, t: "Privacidade total", d: "URLs assinadas, retenção de 7 dias, exclusão sob demanda. LGPD por desenho." },
    { icon: Headphones, t: "Suporte em português", d: "WhatsApp, e-mail e atendimento humano. Não é chatbot — é gente." },
    { icon: Sparkles, t: "Pague em real, com Pix", d: "Sem conversão de moeda. Sem IOF. Pix instantâneo ou cartão em até 3x sem juros." },
  ];

  return (
    <section className="py-32 md:py-40 px-6 md:px-10 bg-ink-deep border-y border-ink-line">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-20 max-w-3xl">
          <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Diferenciais</div>
          <h2 className="font-display leading-[0.95] tracking-editorial" style={{ fontWeight: 300, fontSize: "clamp(40px, 5vw, 72px)" }}>
            Feito para quem <em className="italic text-copper">imprime</em>, não só posta.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-line">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div key={i} className="bg-ink-deep p-8 md:p-10 hover:bg-ink-card transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <Icon size={20} className="text-copper" strokeWidth={1.25} />
                  <span className="text-[10px] uppercase tracking-[0.25em] text-bone-dim font-mono">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="text-xl mb-3 font-display" style={{ fontWeight: 400, fontSize: "24px" }}>
                  {it.t}
                </h3>
                <p className="text-bone-dim leading-relaxed text-[15px]">{it.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
