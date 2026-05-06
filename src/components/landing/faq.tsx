"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export function Faq() {
  const [open, setOpen] = useState<number>(0);
  const faqs = [
    { q: "Os 5 créditos grátis dão pra fazer o quê?", a: "Cinco imagens em resolução padrão (até 4 MP de saída) ou uma imagem em 4K + uma em 2K. Você decide. Sem cartão, sem pegadinha." },
    { q: "Quanto tempo leva pra processar?", a: "Em média 15 segundos por imagem. Imagens muito grandes (acima de 8K) podem levar até 40 segundos. Você é avisado por e-mail quando termina, então pode fechar a aba." },
    { q: "Os créditos expiram?", a: "Pacotes avulsos: créditos válidos por 12 meses. Assinaturas mensais: créditos não usados expiram no fim do mês — eles são uma alocação mensal, não acumulativa." },
    { q: "O que acontece com minhas fotos depois do processamento?", a: "Ficam armazenadas com URL assinada por 7 dias para você baixar. Após esse prazo, são excluídas automaticamente. Você também pode excluir manualmente a qualquer momento no painel." },
    { q: "Posso usar para foto antiga / restauração?", a: "Nossa IA é otimizada para upscale (aumentar resolução com nitidez). Para foto antiga muito danificada — arranhões, manchas, partes faltando — recomendamos combinar com nosso modo Restauração (em breve)." },
    { q: "Emite nota fiscal?", a: "Sim. NF-e disponível para todos os planos. Para clientes business e gráficas, nota com CNPJ no checkout." },
    { q: "E se der erro? Perco meus créditos?", a: "Não. Os créditos só são debitados em definitivo quando o processamento termina com sucesso. Se houver qualquer erro técnico, eles voltam pra sua conta automaticamente." },
    { q: "Posso cancelar a assinatura quando quiser?", a: "Sim, sem multa, sem ligação, sem ginástica. Cancelamento direto pelo painel. Você mantém os créditos do mês corrente." },
  ];

  return (
    <section id="faq" className="py-32 md:py-40 px-6 md:px-10">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Dúvidas</div>
            <h2 className="font-display leading-[0.95] tracking-editorial mb-8" style={{ fontWeight: 300, fontSize: "clamp(40px, 4vw, 64px)" }}>
              Antes de você <em className="italic text-copper">perguntar</em>.
            </h2>
            <p className="text-bone-dim leading-relaxed">
              Não encontrou? Manda no WhatsApp. Resposta humana, em até 2 horas no horário comercial.
            </p>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <div className="border-t border-ink-line">
              {faqs.map((f, i) => (
                <div key={i} className="border-b border-ink-line">
                  <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full py-6 flex items-start justify-between gap-6 text-left group">
                    <span className="text-lg md:text-xl text-bone group-hover:text-copper transition-colors font-display" style={{ fontWeight: 400 }}>
                      {f.q}
                    </span>
                    <span className="mt-1 text-copper flex-shrink-0">
                      {open === i ? <Minus size={20} strokeWidth={1.25} /> : <Plus size={20} strokeWidth={1.25} />}
                    </span>
                  </button>
                  <div className="overflow-hidden transition-all duration-300 ease-out" style={{ maxHeight: open === i ? "300px" : "0px" }}>
                    <p className="pb-6 pr-12 text-bone-dim leading-relaxed">{f.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
