export function Testimonials() {
  const t = [
    {
      q: "Mandei uma foto da minha avó tirada nos anos 60. Quando vi o resultado pra entregar pro meu pai no aniversário dele, chorei. Detalhes que eu nunca tinha visto.",
      a: "Marina A.",
      r: "São Paulo · Cliente Avulso",
    },
    {
      q: "Uso pra ampliar fotos de casamento pros álbuns grandes. Antes eu pagava editor — agora resolvo em 15 segundos. Cancelei meu Topaz.",
      a: "Rafael P.",
      r: "Curitiba · Plano Pro",
    },
    {
      q: "Atendo gráficas que recebem foto de celular pra imprimir banner 3 metros. UltraImage virou parte do meu fluxo. Margem subiu 40%.",
      a: "Gráfica Express",
      r: "Belo Horizonte · Plano Business",
    },
  ];

  return (
    <section className="py-32 md:py-40 px-6 md:px-10 bg-ink-deep border-y border-ink-line">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-16">
          <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Depoimentos</div>
          <h2 className="font-display leading-[0.95] tracking-editorial max-w-3xl" style={{ fontWeight: 300, fontSize: "clamp(40px, 5vw, 72px)" }}>
            <em className="italic text-copper">Quem usa</em>, conta.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-ink-line">
          {t.map((it, i) => (
            <div key={i} className="bg-ink-deep p-8 md:p-10 hover:bg-ink-card transition-colors">
              <div className="text-copper text-5xl mb-4 font-display" style={{ fontWeight: 300, lineHeight: 0.5 }}>
                &ldquo;
              </div>
              <p className="text-bone leading-relaxed mb-8 font-display italic" style={{ fontWeight: 300, fontSize: "20px" }}>
                {it.q}
              </p>
              <div className="border-t border-ink-line pt-4">
                <div className="text-bone text-sm font-medium">{it.a}</div>
                <div className="text-bone-dim text-xs mt-1 font-mono">{it.r}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
