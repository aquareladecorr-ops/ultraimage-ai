// @ts-nocheck
import { unstable_noStore as noStore } from "next/cache";
import { createServer, createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Download, AlertCircle, RefreshCw } from "lucide-react";
import { getPresignedReadUrl } from "@/lib/storage/r2";
import { getTierById } from "@/config/credits";
import { formatDate } from "@/lib/utils";
import { ResultComparator } from "@/components/app/result-comparator";

export default async function ResultPage({ params }) {
  noStore();
  const supabase = createServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) notFound();

  const admin = createAdminClient();
  const { data: job } = await admin
    .from("image_jobs")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", auth.user.id)
    .single();

  if (!job) notFound();

  const tier = getTierById(job.target_resolution_tier);
  const originalUrl = job.original_url
    ? await getPresignedReadUrl(job.original_url, 3600).catch(() => null)
    : null;
  const resultUrl = job.result_url
    ? await getPresignedReadUrl(job.result_url, 3600).catch(() => null)
    : null;

  let expiresIn = null;
  if (job.expires_at && job.status === "completed") {
    expiresIn = Math.max(
      0,
      Math.floor(
        (new Date(job.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
      <Link
        href="/dashboard"
        className="text-sm text-bone-dim hover:text-bone transition mb-8 inline-block"
      >
        Voltar ao painel
      </Link>

      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.3em] text-copper mb-3 font-mono">
          Resultado
        </div>
        <h1
          className="font-display leading-[0.95] tracking-editorial mb-2"
          style={{ fontWeight: 300 }}
        >
          {job.status === "completed" && (
            <em className="italic text-copper">Sua imagem esta pronta.</em>
          )}
          {job.status === "processing" && (
            <em className="italic text-copper">Processando...</em>
          )}
          {job.status === "failed" && (
            <em className="italic text-copper-deep">Falhou.</em>
          )}
          {job.status === "pending" && (
            <span className="text-bone-dim">Na fila</span>
          )}
          {job.status === "canceled" && (
            <span className="text-bone-dim">Cancelada</span>
          )}
        </h1>
        <p className="text-bone-dim text-sm font-mono">
          {job.original_filename} &middot; {tier?.label} &middot;{" "}
          {formatDate(job.created_at)}
        </p>
      </div>

      {job.status === "completed" && resultUrl && (
        <div className="space-y-10">
          {/* Before/After comparator */}
          {originalUrl ? (
            <div className="pt-8">
              <ResultComparator
                beforeUrl={originalUrl}
                afterUrl={resultUrl}
                beforeLabel={"original"}
                afterLabel={tier?.label ?? "ultra engine"}
              />
            </div>
          ) : (
            /* Fallback: just result if no original URL */
            <div className="border border-ink-line bg-ink-deep aspect-[16/10] relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl}
                alt="Resultado"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          )}

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-bone-dim font-mono border-t border-ink-line pt-6">
            <div>
              <span className="text-copper">↗</span>{" "}
              {job.original_width && job.original_height
                ? job.original_width + "x" + job.original_height + " -> " + (tier?.label ?? "ultra")
                : "resolucao aumentada"}
            </div>
            <div>
              <span className="text-copper">▣</span>{" "}
              {tier?.approxMegapixels ? tier.approxMegapixels + " MP saida" : tier?.label}
            </div>
            <div>
              <span className="text-copper">⏱</span>{" "}
              {job.created_at ? formatDate(job.created_at) : "processado"}
            </div>
            {expiresIn !== null && (
              <div>
                <span className="text-copper">◷</span>{" "}
                expira em {expiresIn}d
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <a
              href={"/api/download?jobId=" + job.id}
              className="inline-flex items-center gap-2 bg-bone text-ink px-6 py-3 font-medium hover:bg-copper transition"
            >
              <Download size={16} />
              Baixar imagem
            </a>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 border border-ink-line px-6 py-3 hover:border-copper transition"
            >
              Processar outra <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {job.status === "processing" && (
        <div className="border border-ink-line bg-ink-deep p-12 text-center">
          <div className="inline-block w-10 h-10 border-2 border-copper border-t-transparent rounded-full animate-spin mb-6" />
          <p className="text-bone-dim mb-4">Processando sua imagem...</p>
          <p className="text-xs text-bone-dim font-mono mb-6">
            isso pode levar ate 40 segundos
          </p>
          <Link
            href={"/result/" + job.id}
            className="inline-flex items-center gap-2 border border-ink-line px-4 py-2 text-sm hover:border-copper transition"
          >
            <RefreshCw size={14} />
            Atualizar status
          </Link>
        </div>
      )}

      {job.status === "failed" && (
        <div className="border border-copper-deep/40 bg-copper-deep/10 p-8">
          <AlertCircle size={20} className="text-copper-deep mb-4" />
          <p className="text-bone mb-2">{job.error_message ?? "Erro desconhecido"}</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-bone text-ink px-6 py-3 font-medium hover:bg-copper transition mt-4"
          >
            Tentar de novo <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
