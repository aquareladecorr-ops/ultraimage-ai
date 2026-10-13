const items = [
  { q: "O serviço está gratuito?", a: "Sim. Durante esta fase, não há cobrança para melhorar imagens. O acesso depende do agente local estar conectado e disponível." },
  { q: "Como funciona o processamento?", a: "As imagens são enviadas com segurança e processadas pelo agente local conectado ao UltraImage. Quando o trabalho terminar, você poderá baixar o resultado no painel." },
  { q: "Quais imagens posso enviar?", a: "Use JPG, PNG ou WebP de até 25 MB. No modo local atual, a imagem original pode ter até 1,2 megapixel." },
  { q: "O que acontece se o processamento falhar?", a: "Você poderá tentar novamente pelo painel. Durante o acesso gratuito, nenhum crédito ou pagamento é utilizado." },
  { q: "Meus arquivos ficam disponíveis por quanto tempo?", a: "Os resultados ficam disponíveis no painel por até 7 dias. Baixe o arquivo para guardá-lo por mais tempo." },
];

export function Faq() {
  return (
    <section id="faq" className="py-28 md:py-36 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Dúvidas</div>
        <h2 className="font-display leading-[0.95] tracking-editorial mb-12" style={{ fontWeight: 300, fontSize: "clamp(40px, 5vw, 72px)" }}>
          Perguntas <em className="italic text-copper">frequentes</em>.
        </h2>
        <div className="divide-y divide-ink-line border-y border-ink-line">
          {items.map((item) => (
            <details key={item.q} className="group py-6">
              <summary className="cursor-pointer list-none flex justify-between gap-6 text-lg font-display">
                {item.q}<span className="text-copper group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-bone-dim leading-relaxed mt-4 max-w-3xl">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
