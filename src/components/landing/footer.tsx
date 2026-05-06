export function Footer() {
  return (
    <footer className="border-t border-ink-line px-6 md:px-10 py-16 bg-ink">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 relative">
                <div className="absolute inset-0 rounded-sm border border-copper rotate-45" />
                <div className="absolute inset-1 bg-copper rotate-45" />
              </div>
              <span className="font-display tracking-tight" style={{ fontWeight: 500, fontSize: "20px" }}>
                ultraimage<span className="text-copper">.</span>ai
              </span>
            </div>
            <p className="text-bone-dim leading-relaxed max-w-md mb-6">
              A primeira plataforma brasileira de upscale premium com IA. Feita por brasileiros, em português, com pagamento em real.
            </p>
            <div className="flex items-center gap-4 text-xs text-bone-dim font-mono">
              <span>CNPJ 00.000.000/0001-00</span>
              <span className="w-px h-3 bg-ink-line" />
              <span>Brasil</span>
            </div>
          </div>

          {[
            { title: "Produto", links: ["Como funciona", "Planos", "API (em breve)", "Status"] },
            { title: "Suporte", links: ["Central de ajuda", "WhatsApp", "contato@"] },
            { title: "Legal", links: ["Termos de uso", "Privacidade", "Reembolso", "LGPD"] },
          ].map((col, i) => (
            <div key={col.title} className={`md:col-span-2 ${i === 0 ? "md:col-start-7" : ""}`}>
              <div className="text-xs uppercase tracking-[0.25em] text-copper mb-4 font-mono">{col.title}</div>
              <ul className="space-y-2.5 text-bone-dim text-sm">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-bone transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-ink-line flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-bone-dim font-mono">
          <span>© 2026 UltraImage AI. Todos os direitos reservados.</span>
          <span>Feito no Brasil 🇧🇷 com IA proprietária</span>
        </div>
      </div>
    </footer>
  );
}
