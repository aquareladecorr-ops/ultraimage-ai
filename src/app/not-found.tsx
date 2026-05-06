import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink text-bone flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-6 font-mono">§ 404</div>
        <h1 className="font-display leading-[0.9] tracking-editorial mb-6" style={{ fontWeight: 300, fontSize: "clamp(56px, 12vw, 144px)" }}>
          Não <em className="italic text-copper">encontrado</em>.
        </h1>
        <p className="text-bone-dim mb-10 leading-relaxed">
          Essa página não existe — ou foi removida. Mas você pode voltar pra casa.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 bg-bone text-ink px-6 py-3 font-medium hover:bg-copper transition">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
