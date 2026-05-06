// @ts-nocheck
import { createServer, createAdminClient } from "@/lib/supabase/server";
import { formatBrl, formatDate } from "@/lib/utils";

export default async function AdminPage() {
  // Note: middleware already validated is_admin
  const sb = createServer();
  const admin = createAdminClient();

  const { data: { user } } = await sb.auth.getUser();

  // Aggregate metrics — all use admin client to bypass RLS
  const [
    { count: usersCount },
    { count: jobsCount },
    { count: jobsCompleted },
    { count: jobsFailed },
    { data: recentPayments },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("image_jobs").select("*", { count: "exact", head: true }),
    admin.from("image_jobs").select("*", { count: "exact", head: true }).eq("status", "completed"),
    admin.from("image_jobs").select("*", { count: "exact", head: true }).eq("status", "failed"),
    admin
      .from("payments")
      .select("id, package_name, amount_brl, status, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Sum approved revenue (last 30 days)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: approved30d } = await admin
    .from("payments")
    .select("amount_brl")
    .eq("status", "approved")
    .gte("created_at", since);
  const revenue30d = (approved30d ?? []).reduce((sum, p) => sum + Number(p.amount_brl), 0);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-3 font-mono">§ Admin</div>
        <h1 className="font-display leading-[0.95] tracking-editorial mb-1" style={{ fontWeight: 300, fontSize: "clamp(36px, 5vw, 64px)" }}>
          Visão geral.
        </h1>
        <p className="text-sm text-bone-dim font-mono">logado como {user?.email}</p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-px bg-ink-line border border-ink-line mb-12">
        <Stat label="Usuários" value={usersCount ?? 0} />
        <Stat label="Imagens processadas" value={jobsCompleted ?? 0} />
        <Stat label="Falhas" value={jobsFailed ?? 0} />
        <Stat label="Receita 30d" value={formatBrl(revenue30d)} mono={false} />
      </div>

      <h2 className="font-display text-2xl mb-6" style={{ fontWeight: 400 }}>
        Últimos pagamentos
      </h2>
      {!recentPayments || recentPayments.length === 0 ? (
        <p className="text-bone-dim text-sm">Sem pagamentos ainda.</p>
      ) : (
        <div className="border border-ink-line">
          {recentPayments.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between gap-4 p-4 text-sm ${
                i < recentPayments.length - 1 ? "border-b border-ink-line" : ""
              }`}
            >
              <div>
                <div className="text-bone">{p.package_name}</div>
                <div className="text-xs text-bone-dim font-mono mt-0.5">
                  {formatDate(p.created_at)} · user {p.user_id.slice(0, 8)}…
                </div>
              </div>
              <div className="text-right">
                <div className="text-bone font-mono">{formatBrl(Number(p.amount_brl))}</div>
                <div className="text-xs text-bone-dim font-mono">{p.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-bone-dim font-mono mt-12">
        Total de jobs: {jobsCount ?? 0} · Esta página é privada e protegida pelo middleware.
      </p>
    </div>
  );
}

function Stat({ label, value, mono = true }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="bg-ink-deep p-6">
      <div className="text-xs uppercase tracking-[0.25em] text-bone-dim mb-2 font-mono">{label}</div>
      <div className={`font-display ${mono ? "" : ""}`} style={{ fontWeight: 300, fontSize: "44px", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
