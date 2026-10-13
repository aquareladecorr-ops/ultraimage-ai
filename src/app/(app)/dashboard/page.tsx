import { createServer, createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowUpRight, Image as ImageIcon, Plus } from "lucide-react";
import { formatDate, bytesToReadable } from "@/lib/utils";
import { SignupTracker } from "@/components/app/signup-tracker";
import { BILLING_ENABLED } from "@/config/billing";

export default async function DashboardPage() {
  const supabase = await createServer();
  const admin = createAdminClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user!.id;

  const [{ data: profile }, { data: recentJobs }] = await Promise.all([
    admin.from("profiles").select("full_name, created_at").eq("id", userId).single(),
    admin.from("image_jobs")
      .select("id, original_filename, target_resolution_tier, status, created_at, original_size_bytes")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(8),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
      <SignupTracker createdAt={profile?.created_at ?? ""} />
      <div className="mb-12">
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-3 font-mono">§ Painel</div>
        <h1 className="font-display leading-[0.95] tracking-editorial" style={{ fontWeight: 300, fontSize: "clamp(36px, 5vw, 64px)" }}>
          Olá{firstName ? `, ${firstName}` : ""}.<br />
          <em className="italic text-copper">Vamos processar.</em>
        </h1>
      </div>

      {BILLING_ENABLED ? (
        <div className="border border-ink-line p-6 md:p-8 mb-12 text-bone-dim">Consulte seu saldo e histórico na área de créditos.</div>
      ) : (
        <div className="border border-copper/40 bg-ink-deep p-6 md:p-8 mb-12">
          <div className="text-xs uppercase tracking-[0.25em] text-copper mb-2 font-mono">Acesso gratuito</div>
          <p className="text-bone-dim">Melhore imagens sem cobrança durante esta fase. O processamento depende do agente local estar conectado.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-16">
        <Link href="/upload" className="inline-flex items-center gap-3 bg-copper text-ink px-6 py-3 hover:bg-copper/90 transition text-sm font-mono">
          <Plus size={16} /> Processar nova imagem <ArrowUpRight size={16} />
        </Link>
        {BILLING_ENABLED && <Link href="/credits" className="inline-flex items-center gap-3 border border-ink-line px-6 py-3 hover:border-copper transition text-sm font-mono">Ver créditos</Link>}
      </div>

      <section className="mb-16" aria-label="Imagens recentes">
        <h2 className="text-xs uppercase tracking-[0.3em] text-copper mb-6 font-mono">Imagens recentes</h2>
        {!recentJobs || recentJobs.length === 0 ? (
          <div className="border border-ink-line p-8 text-center text-bone-dim text-sm font-mono">
            Você ainda não processou nenhuma imagem. <Link href="/upload" className="text-copper hover:underline">Processar a primeira &rarr;</Link>
          </div>
        ) : (
          <div className="border border-ink-line divide-y divide-ink-line">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between px-6 py-4 hover:bg-ink-deep transition">
                <div className="flex items-center gap-4">
                  <ImageIcon size={16} className="text-bone-dim flex-shrink-0" />
                  <div>
                    <div className="text-sm font-mono text-bone truncate max-w-[200px] md:max-w-xs">{job.original_filename ?? "imagem"}</div>
                    <div className="text-xs text-bone-dim font-mono mt-0.5">{job.target_resolution_tier} &middot; {job.original_size_bytes ? bytesToReadable(job.original_size_bytes) : "—"} &middot; {formatDate(job.created_at)}</div>
                  </div>
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 border ${job.status === "completed" ? "border-green-800 text-green-400" : job.status === "failed" ? "border-red-800 text-red-400" : "border-ink-line text-bone-dim"}`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
