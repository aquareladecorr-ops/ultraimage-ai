import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-ink-line/60 backdrop-blur-md bg-ink/80">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 relative">
            <div className="absolute inset-0 rounded-sm border border-copper rotate-45" />
            <div className="absolute inset-1 bg-copper rotate-45" />
          </div>
          <span className="font-display tracking-tight text-bone" style={{ fontWeight: 500, fontSize: "18px" }}>
            ultraimage<span className="text-copper">.</span>ai
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-bone-dim">
          <a href="#como" className="hover:text-bone transition">Como funciona</a>
          <a href="#planos" className="hover:text-bone transition">Planos</a>
          <a href="#faq" className="hover:text-bone transition">Dúvidas</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline text-sm text-bone-dim hover:text-bone transition">
            Entrar
          </Link>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 bg-bone text-ink px-4 py-2 text-sm font-medium hover:bg-copper transition-colors"
          >
            Começar
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
