import { unstable_noStore as noStore } from "next/cache";
import { createServer, createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Download, AlertCircle } from "lucide-react";
import { getPresignedReadUrl } from "@/lib/storage/r2";
import { getTierById } from "@/config/credits";
import { formatDate, bytesToReadable } from "@/lib/utils";

export default async function ResultPage({ params }: { params: { id: string } }) {
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

  // Generate presigned URLs for display/download (1h validity)
  const [originalUrl, resultUrl] = await Promise.all([
        job.original_url ? getPresignedReadUrl(job.original_url, 3600).catch(() => null) : null,
        job.result_url ? getPresignedReadUrl(job.result_url, 3600).catch(() => null) : null,
      ]);

  const expiresIn = job.expires_at && job.status === "completed"
      ? Math.max(0, Math.floor((new Date(job.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

  return (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12 md:py-16">
              <Link href="/dashboard" className="text-sm text-bone-dim hover:text-bone transition mb-8 inline-block">
                      &larr; Voltar ao painel
              </Link>Link>
        
              <div className="mb-8">
                      <div className="text-xs uppercase tracking-[0.3em] text-copper mb-3 font-mono">&sect; Resultado</div>div>
                      <h1 className="font-display leading-[0.95] tracking-editorial mb-2" style={{ fontWeight: 300, fontSize: "clamp(32px, 4vw, 56px)" }}>
                        {job.status === "completed" && (
                      <>
                                    Sua imagem<br />
                                    <em className="italic text-copper">est&aacute; pronta.</em>em>
                      </>>
                    )}
                        {job.status === "processing" && (
                      <>
                                    Ainda <em className="italic text-copper">processando...</em>em>
                      </>>
                    )}
                        {job.status === "failed" && <em className="italic text-copper-deep">Falhou.</em>em>}
                        {job.status === "pending" && <span className="text-bone-dim">Na fila</span>span>}
                        {job.status === "canceled" && <span className="text-bone-dim">Cancelada</span>span>}
                      </h1>h1>
                      <p className="text-bone-dim text-sm font-mono">
                        {job.original_filename} &middot; {tier?.label} &middot; {formatDate(job.created_at)}
                      </p>p>
              </div>div>
        
          {/* Status-specific content */}
          {job.status === "completed" && resultUrl && (
                  <>
                            <div className="mb-8">
                                        <div className="border border-ink-line bg-ink-deep aspect-[16/10] relative overflow-hidden">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                                      <img src={resultUrl} alt="Resultado" className="absolute inset-0 w-full h-full object-contain" />
                                        </div>div>
                                        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                                      <div className="flex flex-col sm:flex-row gap-3">
                                                                      <a
                                                                                          href={resultUrl}
                                                                                          download={`ultraimage-${job.id}.jpg`}
                                                                                          className="inline-flex items-center gap-2 bg-bone text-ink px-6 py-3 font-medium hover:bg-copper transition"
                                                                                        >
                                                                                        <Download size={16} />
                                                                                        Baixar imagem
                                                                      </a>a>
                                                                      <Link
                                                                                          href="/upload"
                                                                                          className="inline-flex items-center gap-2 border border-ink-line px-6 py-3 hover:border-copper transition"
                                                                                        >
                                                                                        Processar outra
                                                                                        <ArrowUpRight size={16} />
                                                                      </Link>Link>
                                                      </div>div>
                                          {expiresIn !== null && (
                                    <span className="text-xs text-bone-dim font-mono">
                                                      expira em {expiresIn} {expiresIn === 1 ? "dia" : "dias"}
                                    </span>span>
                                                      )}
                                        </div>div>
                            </div>div>
                  
                    {/* Compare panel */}
                    {originalUrl && (
                                <div className="grid md:grid-cols-2 gap-4">
                                              <div>
                                                              <div className="text-xs uppercase tracking-[0.25em] text-bone-dim mb-3 font-mono">Original</div>div>
                                                              <div className="border border-ink-line bg-ink-deep aspect-[4/3] relative overflow-hidden">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                <img src={originalUrl} alt="Original" className="absolute inset-0 w-full h-full object-contain" />
                                                              </div>div>
                                                              <div className="mt-2 text-xs text-bone-dim font-mono">
                                                                {job.original_width}&times;{job.original_height} &middot;{" "}
                                                                {job.original_size_bytes ? bytesToReadable(job.original_size_bytes) : "&mdash;"}
                                                              </div>div>
                                              </div>div>
                                              <div>
                                                              <div className="text-xs uppercase tracking-[0.25em] text-copper mb-3 font-mono">Processado</div>div>
                                                              <div className="border border-copper bg-ink-deep aspect-[4/3] relative overflow-hidden">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                <img src={resultUrl} alt="Processado" className="absolute inset-0 w-full h-full object-contain" />
                                                              </div>div>
                                                              <div className="mt-2 text-xs text-bone-dim font-mono">
                                                                {tier?.label} &middot; at&eacute; {tier?.maxDimension}px &middot;{" "}
                                                                {job.processing_time_ms ? `${(job.processing_time_ms / 1000).toFixed(1)}s` : "&mdash;"}
                                                              </div>div>
                                              </div>div>
                                </div>div>
                            )}
                  </>>
                )}
        
          {job.status === "processing" && (
                  <div className="border border-ink-line bg-ink-deep p-12 text-center">
                            <div className="inline-block w-10 h-10 border-2 border-copper border-t-transparent rounded-full animate-spin mb-6" />
                            <p className="text-bone-dim mb-2">Processando sua imagem...</p>p>
                            <p className="text-xs text-bone-dim font-mono">atualize a p&aacute;gina em alguns segundos</p>p>
                  </div>div>
              )}
        
          {job.status === "failed" && (
                  <div className="border border-copper-deep/40 bg-copper-deep/10 p-8">
                            <div className="flex items-start gap-4 mb-6">
                                        <AlertCircle size={20} className="text-copper-deep mt-1 flex-shrink-0" />
                                        <div>
                                                      <p className="text-bone mb-2">{job.error_message ?? "Erro desconhecido"}</p>p>
                                                      <p className="text-xs text-bone-dim font-mono">
                                                                      seus cr&eacute;ditos foram devolvidos integralmente
                                                      </p>p>
                                        </div>div>
                            </div>div>
                            <Link href="/upload" className="inline-flex items-center gap-2 bg-bone text-ink px-6 py-3 font-medium hover:bg-copper transition">
                                        Tentar de novo
                                        <ArrowUpRight size={16} />
                            </Link>Link>
                  </div>div>
              )}
        </div>div>
      );
}</></></></div>
