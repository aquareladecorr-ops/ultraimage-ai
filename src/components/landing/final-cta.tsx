import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function FinalCta() {
  return (
    <section id="cta" className="relative py-32 md:py-40 px-6 md:px-10 bg-ink-deep border-t border-ink-line overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-copper/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-copper-deep/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-[1100px] mx-auto relative text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-6 font-mono">§ Comece agora</div>
        <h2
          className="font-display leading-[0.92] tracking-editorial mb-10"
          style={{ fontWeight: 300, fontSize: "clamp(48px, 8vw, 112px)" }}
        >
          Sua próxima foto<br />
          <em className="italic text-copper">vai impressionar.</em>
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-3 bg-bone text-ink px-8 py-4 text-base font-medium hover:bg-copper transition-colors"
          >
            Criar conta
            <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
