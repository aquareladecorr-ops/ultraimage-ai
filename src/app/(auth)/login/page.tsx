"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` },
    });
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Entrar</div>
      <h1 className="font-display text-4xl mb-2 leading-tight" style={{ fontWeight: 300 }}>
        Bem-vindo de volta.
      </h1>
      <p className="text-bone-dim mb-10">Continue de onde parou.</p>
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full mb-4 py-3 border border-ink-line hover:border-copper transition flex items-center justify-center gap-3 text-sm"
      >
        Entrar com Google
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-ink-line" />
        <span className="text-xs text-bone-dim font-mono">ou</span>
        <div className="flex-1 h-px bg-ink-line" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-bone-dim mb-2 font-mono">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-ink-deep border border-ink-line px-4 py-3 text-bone focus:border-copper focus:outline-none transition"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-[0.2em] text-bone-dim font-mono">Senha</label>
            <Link href="/forgot-password" className="text-xs text-copper hover:underline">
              esqueci
            </Link>
          </div>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink-deep border border-ink-line px-4 py-3 text-bone focus:border-copper focus:outline-none transition"
          />
        </div>
        {error && <p className="text-sm text-copper-deep">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-bone text-ink font-medium hover:bg-copper transition disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-8 text-sm text-bone-dim text-center">
        Não tem conta?{" "}
        <Link href="/signup" className="text-copper hover:underline">
          Criar agora
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-bone-dim text-sm">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
