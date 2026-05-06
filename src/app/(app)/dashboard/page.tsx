import { createServer } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowUpRight, Image as ImageIcon, Plus } from "lucide-react";
import { formatDate, bytesToReadable } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = createServer();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user!.id;

  const [{ data: profile }, { data: recentJobs }, { data: recentTx }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, credits_available, credits_reserved, total_credits_used")
      .eq("id", userId)
      .single(),
    supabase
      .from("image_jobs")
      .select("id, original_filename, target_resolution_tier, status, created_at, original_size_bytes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("credit_transactions")
      .select("type, amount, description, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const credits = profile?.credits_available ?? 0;
  const reserved = profile?.credits_reserved ?? 0;
  const used = profile?.total_credits_used ?? 0;

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
      <div className="mb-12">
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-3 font-mono">§ Painel</div>
        <h1 className="font-display leading-[0.95] tracking-editorial" style={{ fontWeight: 300, fontSize: "clamp(36px, 5vw, 64px)" }}>
          Olá{firstName ? `, ${firstName}` : ""}.<br />
          <em className="italic text-copper">Vamos processar.</em>
        </h1>
      </div>

      {/* Credits panel */}
      <div className="grid md:grid-cols-3 gap-px bg-ink-line mb-12 border border-ink-line">
        <div className="bg-ink-deep p-6 md:p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-bone-dim mb-2 font-mono">Disponível</div>
          <div className="font-display" style={{ fontWeight: 300, fontSize: "56px", lineHeight: 1 }}>
            {credits}
          </div>
          <div className="text-sm text-bone-dim mt-2 font-mono">créditos prontos pra usar</div>
        </div>
        <div className="bg-ink-deep p-6 md:p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-bone-dim mb-2 font-mono">Reservados</div>
          <div className="font-display text-bone-dim" style={{ fontWeight: 300, fontSize: "56px", lineHeight: 1 }}>
            {reserved}
          </div>
          <div className="text-sm text-bone-dim mt-2 font-mono">em jobs em andamento</div>
        </div>
        <div className="bg-ink-deep p-6 md:p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-bone-dim mb-2 font-mono">Total usado</div>
          <div className="font-display" style={{ fontWeight: 300, fontSize: "56px", lineHeight: 1 }}>
            {used}
          </div>
          <div className="text-sm text-bone-dim mt-2 font-mono">desde o início</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-16">
        <Link href="/upload" className="group inline-flex items-center gap-3 bg-bone text-ink px-6 py-3 font-medium hover:bg-copper transition">
          <Plus size={16} />
          Processar nova imagem
          <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
        <Link href="/credits" className="inline-flex items-center gap-3 border border-ink-line px-6 py-3 hover:border-copper transition">
          Comprar mais créditos
        </Link>
      </div>

      {/* Recent jobs */}
      <div className="grid md:grid-cols-12 gap-12 mb-16">
        <section className="md:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl" style={{ fontWeight: 400 }}>
              Imagens recentes
            </h2>
            {recentJobs && recentJobs.length > 0 && (
              <Link href="/dashboard" className="text-sm text-bone-dim hover:text-copper transition">
                Ver tudo
              </Link>
            )}
          </div>

          {!recentJobs || recentJobs.length === 0 ? (
            <div className="border border-dashed border-ink-line p-12 text-center">
              <ImageIcon size={32} strokeWidth={1} className="mx-auto text-bone-dim mb-4" />
              <p className="text-bone-dim mb-6">Você ainda não processou nenhuma imagem.</p>
              <Link href="/upload" className="inline-flex items-center gap-2 text-copper hover:underline">
                Processar a primeira →
              </Link>
            </div>
          ) : (
            <div className="border border-ink-line">
              {recentJobs.map((job, i) => (
                <Link
                  href={`/result/${job.id}`}
                  key={job.id}
                  className={`flex items-center justify-between gap-4 p-4 hover:bg-ink-card transition ${
                    i < recentJobs.length - 1 ? "border-b border-ink-line" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-ink-deep border border-ink-line flex items-center justify-center flex-shrink-0">
                      <ImageIcon size={16} className="text-bone-dim" strokeWidth={1.25} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-bone truncate text-sm">{job.original_filename ?? "imagem.jpg"}</div>
                      <div className="text-xs text-bone-dim font-mono mt-0.5">
                        {job.target_resolution_tier?.toUpperCase()} ·{" "}
                        {job.original_size_bytes ? bytesToReadable(job.original_size_bytes) : "—"} ·{" "}
                        {formatDate(job.created_at)}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="md:col-span-4">
          <h2 className="font-display text-2xl mb-6" style={{ fontWeight: 400 }}>
            Movimentação
          </h2>
          {!recentTx || recentTx.length === 0 ? (
            <p className="text-sm text-bone-dim">Sem movimentação recente.</p>
          ) : (
            <ul className="space-y-3">
              {recentTx.map((tx, i) => (
                <li key={i} className="flex items-start justify-between gap-3 text-sm border-b border-ink-line pb-3">
                  <div className="min-w-0">
                    <div className="text-bone truncate">{tx.description ?? tx.type}</div>
                    <div className="text-xs text-bone-dim font-mono mt-0.5">{formatDate(tx.created_at)}</div>
                  </div>
                  <span className={`font-mono text-sm ${tx.amount > 0 ? "text-copper" : "text-bone-dim"}`}>
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "text-copper border-copper/40",
    processing: "text-bone border-bone/40 animate-pulse",
    pending: "text-bone-dim border-ink-line",
    failed: "text-copper-deep border-copper-deep/40",
    canceled: "text-bone-dim border-ink-line",
  };
  const labels: Record<string, string> = {
    completed: "pronto",
    processing: "processando",
    pending: "na fila",
    failed: "falhou",
    canceled: "cancelado",
  };
  return (
    <span className={`text-xs uppercase tracking-[0.2em] px-2 py-1 border font-mono flex-shrink-0 ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}
