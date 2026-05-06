"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Confirmação</div>
        <h1 className="font-display text-4xl mb-4 leading-tight" style={{ fontWeight: 300 }}>
          Conta criada. ✦
        </h1>
        <p className="text-bone-dim mb-8 leading-relaxed">
          Mandamos um e-mail de confirmação para <strong className="text-bone">{email}</strong>. Clique no link e você está dentro.
        </p>
        <Link href="/login" className="block text-center w-full py-3 bg-bone text-ink font-medium hover:bg-copper transition">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Criar conta</div>
      <h1 className="font-display text-4xl mb-2 leading-tight" style={{ fontWeight: 300 }}>
        Cinco créditos grátis.
      </h1>
      <p className="text-bone-dim mb-10">Sem cartão. Sem cadastro de cobrança.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-bone-dim mb-2 font-mono">Nome</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-ink-deep border border-ink-line px-4 py-3 text-bone focus:border-copper focus:outline-none transition"
          />
        </div>
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
          <label className="block text-xs uppercase tracking-[0.2em] text-bone-dim mb-2 font-mono">Senha</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink-deep border border-ink-line px-4 py-3 text-bone focus:border-copper focus:outline-none transition"
          />
          <p className="text-xs text-bone-dim mt-2">Mínimo 8 caracteres.</p>
        </div>

        {error && <p className="text-sm text-copper-deep">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-bone text-ink font-medium hover:bg-copper transition disabled:opacity-50"
        >
          {loading ? "Criando..." : "Criar conta grátis"}
        </button>

        <p className="text-xs text-bone-dim text-center leading-relaxed">
          Ao criar conta você concorda com nossos{" "}
          <Link href="/terms" className="text-copper hover:underline">termos</Link> e{" "}
          <Link href="/privacy" className="text-copper hover:underline">política de privacidade</Link>.
        </p>
      </form>

      <p className="mt-8 text-sm text-bone-dim text-center">
        Já tem conta?{" "}
        <Link href="/login" className="text-copper hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
