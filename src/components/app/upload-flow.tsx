"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ArrowUpRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { RESOLUTION_TIERS, type ResolutionTier } from "@/config/credits";
import { bytesToReadable } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 25 * 1024 * 1024;

type Stage = "select" | "configure" | "processing" | "error";

type LoadedFile = {
  file: File;
  width: number;
  height: number;
  previewUrl: string;
};

export function UploadFlow({ availableCredits }: { availableCredits: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("select");
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [tierId, setTierId] = useState<string>("4k");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);

  const tier = RESOLUTION_TIERS.find((t) => t.id === tierId)!;
  const hasEnoughCredits = availableCredits >= tier.credits;

  async function handleFile(f: File) {
    setError(null);

    if (!ACCEPTED.includes(f.type)) {
      setError("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`Arquivo muito grande. Máximo: ${bytesToReadable(MAX_BYTES)}.`);
      return;
    }

    // Read dimensions
    const previewUrl = URL.createObjectURL(f);
    const img = new Image();
    img.src = previewUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Imagem inválida"));
    });

    setFile({ file: f, width: img.naturalWidth, height: img.naturalHeight, previewUrl });
    setStage("configure");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function handleProcess() {
    if (!file) return;
    setStage("processing");
    setError(null);
    setProgress("Preparando upload...");

    try {
      // 1. Upload imagem pelo servidor (servidor salva no Supabase Storage)
      setProgress("Enviando imagem...");
      const uploadResp = await fetch(
        "/api/upload-url?filename=" + encodeURIComponent(file.file.name),
        {
          method: "POST",
          headers: { "Content-Type": file.file.type },
          body: file.file,
        }
      );
      if (!uploadResp.ok) throw new Error("Falha no upload da imagem");
      const { key } = await uploadResp.json();

      // 2. Trigger processing
      setProgress("Processando com nossa IA... isso pode levar até 40 segundos");
      const processResp = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalKey: key,
          originalFilename: file.file.name,
          originalSizeBytes: file.file.size,
          originalWidth: file.width,
          originalHeight: file.height,
          tierId,
        }),
      });

      if (!processResp.ok) {
        const data = await processResp.json().catch(() => ({}));
        if (data.error === "insufficient_credits") {
          throw new Error("Créditos insuficientes. Compre mais para continuar.");
        }
        throw new Error(data.detail ?? "Erro no processamento");
      }

      const { jobId } = await processResp.json();
      router.push(`/result/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setStage("error");
    }
  }

  function reset() {
    if (file) URL.revokeObjectURL(file.previewUrl);
    setFile(null);
    setStage("select");
    setError(null);
    setProgress("");
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  if (stage === "select") {
    return (
      <div>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`block border-2 border-dashed p-12 md:p-20 text-center cursor-pointer transition-colors ${
            dragOver ? "border-copper bg-ink-card" : "border-ink-line bg-ink-deep hover:border-copper hover:bg-ink-card"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Upload size={40} strokeWidth={1} className="mx-auto text-bone-dim mb-6" />
          <p className="text-xl font-display mb-2" style={{ fontWeight: 400 }}>
            Arraste sua imagem aqui
          </p>
          <p className="text-bone-dim text-sm mb-1">ou clique para escolher</p>
          <p className="text-xs text-bone-dim font-mono mt-6">JPG · PNG · WebP — até 25 MB</p>
        </label>

        {error && (
          <div className="mt-6 flex items-center gap-3 text-copper-deep border border-copper-deep/40 bg-copper-deep/10 p-4">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    );
  }

  if (stage === "configure" && file) {
    return (
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <div className="relative border border-ink-line bg-ink-deep aspect-[4/3] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
            <button
              onClick={reset}
              className="absolute top-3 right-3 w-8 h-8 bg-ink/80 backdrop-blur-sm flex items-center justify-center hover:bg-ink transition"
              aria-label="Remover"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-bone-dim font-mono">
            <div>
              <div className="text-bone-dim">Arquivo</div>
              <div className="text-bone truncate">{file.file.name}</div>
            </div>
            <div>
              <div className="text-bone-dim">Original</div>
              <div className="text-bone">
                {file.width}×{file.height}
              </div>
            </div>
            <div>
              <div className="text-bone-dim">Tamanho</div>
              <div className="text-bone">{bytesToReadable(file.file.size)}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-copper mb-4 font-mono">§ Resolução</div>
          <h2 className="font-display text-2xl mb-6" style={{ fontWeight: 400 }}>
            Escolha a saída
          </h2>

          <div className="space-y-2 mb-8">
            {RESOLUTION_TIERS.map((t) => (
              <TierOption key={t.id} tier={t} selected={t.id === tierId} onSelect={() => setTierId(t.id)} />
            ))}
          </div>

          <div className="border-t border-ink-line pt-6">
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-bone-dim">Custo</span>
              <span className="font-mono text-copper">
                {tier.credits} {tier.credits === 1 ? "crédito" : "créditos"}
              </span>
            </div>
            <div className="flex items-center justify-between mb-6 text-sm">
              <span className="text-bone-dim">Saldo após</span>
              <span className="font-mono text-bone-dim">{availableCredits - tier.credits} restantes</span>
            </div>

            {!hasEnoughCredits ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-copper-deep border border-copper-deep/40 bg-copper-deep/10 p-3 text-sm">
                  <AlertCircle size={16} />
                  <span>Você precisa de {tier.credits - availableCredits} créditos a mais.</span>
                </div>
                <Link
                  href="/credits"
                  className="block text-center w-full py-3 bg-bone text-ink font-medium hover:bg-copper transition"
                >
                  Comprar créditos
                </Link>
              </div>
            ) : (
              <button
                onClick={handleProcess}
                className="w-full py-3 bg-bone text-ink font-medium hover:bg-copper transition flex items-center justify-center gap-2"
              >
                Processar agora
                <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (stage === "processing") {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-12 h-12 border-2 border-copper border-t-transparent rounded-full animate-spin mb-8" />
        <h2 className="font-display text-2xl mb-3" style={{ fontWeight: 400 }}>
          Processando...
        </h2>
        <p className="text-bone-dim">{progress}</p>
        <p className="text-xs text-bone-dim font-mono mt-8">não feche esta aba — você também receberá um e-mail quando terminar</p>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} strokeWidth={1} className="mx-auto text-copper-deep mb-6" />
        <h2 className="font-display text-2xl mb-3" style={{ fontWeight: 400 }}>
          Não conseguimos processar.
        </h2>
        <p className="text-bone-dim mb-2">{error}</p>
        <p className="text-xs text-bone-dim font-mono mb-8">seus créditos foram preservados</p>
        <button onClick={reset} className="px-6 py-3 border border-ink-line hover:border-copper transition">
          Tentar de novo
        </button>
      </div>
    );
  }

  return null;
}

function TierOption({ tier, selected, onSelect }: { tier: ResolutionTier; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 text-left border transition flex items-center justify-between gap-4 ${
        selected ? "border-copper bg-ink-card" : "border-ink-line bg-ink-deep hover:border-copper/60"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-bone">{tier.label}</span>
          <span className="text-xs text-bone-dim font-mono">~{tier.approxMegapixels} MP</span>
        </div>
        <div className="text-xs text-bone-dim">{tier.description}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-mono text-copper text-sm">
          {tier.credits} {tier.credits === 1 ? "crédito" : "créditos"}
        </div>
      </div>
    </button>
  );
}
