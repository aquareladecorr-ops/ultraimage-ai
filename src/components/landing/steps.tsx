export function Steps() {
  const steps = [
    { n: "01", t: "Envie sua imagem", d: "Arraste e solte. JPG, PNG ou WebP até 25 MB. Sua imagem é criptografada em trânsito e armazenada com URL assinada.", tag: "Upload" },
    { n: "02", t: "Escolha a resolução", d: "De 4 MP a 100 MP de saída. O sistema mostra exatamente quantos créditos serão usados antes de processar.", tag: "Configuração" },
    { n: "03", t: "Receba em segundos", d: "Nossa IA processa em ~15 segundos. Download direto, com aviso por e-mail. Histórico fica no painel por 7 dias.", tag: "Resultado" },
  ];

  return (
    <section id="como" className="py-32 md:py-40 px-6 md:px-10">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-12 gap-8 mb-20">
          <div className="md:col-span-4">
            <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Processo</div>
            <h2 className="font-display leading-[0.95] tracking-editorial" style={{ fontWeight: 300, fontSize: "clamp(40px, 5vw, 72px)" }}>
              Três passos.<br />
              <em className="italic text-copper">Nenhuma curva</em>
              <br />
              de aprendizado.
            </h2>
          </div>
          <p className="md:col-span-5 md:col-start-8 text-bone-dim text-lg leading-relaxed self-end">
            Construímos para fotógrafos que precisam de resultado, não de tutorial. Tudo em português, com o suporte humano que falta nas plataformas internacionais.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-ink-line">
          {steps.map((s) => (
            <div key={s.n} className="bg-ink p-8 md:p-10 hover:bg-ink-card transition-colors">
              <div className="flex items-start justify-between mb-12">
                <span className="text-copper font-display" style={{ fontWeight: 200, fontSize: "88px", lineHeight: 1, fontVariationSettings: '"opsz" 144' }}>
                  {s.n}
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-bone-dim mt-3 font-mono">{s.tag}</span>
              </div>
              <h3 className="text-2xl mb-3 font-display" style={{ fontWeight: 400 }}>
                {s.t}
              </h3>
              <p className="text-bone-dim leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
