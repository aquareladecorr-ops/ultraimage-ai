export function Marquee() {
  const items = ["Fotógrafos", "Gráficas", "Designers", "Agências", "Restauração de família", "E-commerce", "Estúdios", "Editoras"];
  return (
    <section className="border-y border-ink-line py-6 overflow-hidden bg-ink-deep">
      <div className="flex gap-12 whitespace-nowrap animate-marquee">
        {[...items, ...items, ...items].map((it, i) => (
          <div key={i} className="flex items-center gap-12 text-bone-dim font-display" style={{ fontWeight: 300, fontSize: "22px" }}>
            <span className="italic">{it}</span>
            <span className="text-copper">✦</span>
          </div>
        ))}
      </div>
    </section>
  );
}
