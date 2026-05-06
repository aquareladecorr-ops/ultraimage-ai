"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.3em] text-copper mb-4 font-mono">§ Recuperar senha</div>
      <h1 className="font-display text-4xl mb-2 leading-tight" style={{ fontWeight: 300 }}>
        Sem stress.
      </h1>
      <p className="text-bone-dim mb-10">Mandamos um link de recuperação para seu e-mail.</p>

      {sent ? (
        <div className="border border-ink-line p-6 bg-ink-deep">
          <p className="text-bone leading-relaxed">
            Se existe uma conta com <strong>{email}</strong>, você vai receber um link de redefinição em alguns minutos.
          </p>
        </div>
      ) : (
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
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-bone text-ink font-medium hover:bg-copper transition disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      )}

      <p className="mt-8 text-sm text-bone-dim text-center">
        <Link href="/login" className="text-copper hover:underline">
          Voltar
        </Link>
      </p>
    </div>
  );
}
