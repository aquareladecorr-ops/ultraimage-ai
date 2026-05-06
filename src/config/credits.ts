/**
 * Credit consumption tiers.
 * Single source of truth for: resolution → credits required → internal cost.
 *
 * NOTE: `internalCostBrl` is INTERNAL ONLY. Never expose to client/frontend.
 * It exists here for admin dashboards and margin calculations.
 */

export type ResolutionTier = {
  id: string;
  label: string;
  description: string;
  maxDimension: number;       // max width/height in pixels
  approxMegapixels: number;   // approximate output MP
  credits: number;
  /** @internal — used only on the server for margin/analytics */
  internalCostBrl: number;
};

export const RESOLUTION_TIERS: readonly ResolutionTier[] = [
  {
    id: "2k",
    label: "2K",
    description: "Até 2048×2048 — ideal para web e redes sociais",
    maxDimension: 2048,
    approxMegapixels: 4,
    credits: 1,
    internalCostBrl: 0.22,
  },
  {
    id: "2_9k",
    label: "2.9K",
    description: "Até 2900×2900 — bom para impressão pequena",
    maxDimension: 2900,
    approxMegapixels: 8,
    credits: 2,
    internalCostBrl: 0.44,
  },
  {
    id: "4k",
    label: "4K",
    description: "Até 4000×4000 — fotos para álbum",
    maxDimension: 4000,
    approxMegapixels: 16,
    credits: 3,
    internalCostBrl: 0.88,
  },
  {
    id: "5k",
    label: "5K",
    description: "Até 5000×5000 — impressão profissional",
    maxDimension: 5000,
    approxMegapixels: 25,
    credits: 4,
    internalCostBrl: 1.38,
  },
  {
    id: "6k",
    label: "6K",
    description: "Até 6000×6000 — canvas médio",
    maxDimension: 6000,
    approxMegapixels: 36,
    credits: 6,
    internalCostBrl: 1.98,
  },
  {
    id: "7k",
    label: "7K",
    description: "Até 7000×7000 — canvas grande",
    maxDimension: 7000,
    approxMegapixels: 49,
    credits: 8,
    internalCostBrl: 2.70,
  },
  {
    id: "8k",
    label: "8K",
    description: "Até 8000×8000 — banner / outdoor",
    maxDimension: 8000,
    approxMegapixels: 64,
    credits: 10,
    internalCostBrl: 3.52,
  },
  {
    id: "10k",
    label: "10K · Ultra",
    description: "Até 10000×10000 — máximo absoluto, impressão de 2m+",
    maxDimension: 10000,
    approxMegapixels: 100,
    credits: 15,
    internalCostBrl: 5.50,
  },
] as const;

export function getTierById(id: string): ResolutionTier | undefined {
  return RESOLUTION_TIERS.find((t) => t.id === id);
}

/**
 * Determine the smallest tier that satisfies the desired output dimensions.
 * Returns null if requested dimensions exceed the maximum tier.
 */
export function tierForOutputDimensions(width: number, height: number): ResolutionTier | null {
  const longestSide = Math.max(width, height);
  return RESOLUTION_TIERS.find((t) => longestSide <= t.maxDimension) ?? null;
}

/**
 * Compute output dimensions if we apply scale to the input, capped to a tier.
 */
export function computeScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  tier: ResolutionTier
): { width: number; height: number; scaleApplied: number } {
  const longestSide = Math.max(originalWidth, originalHeight);
  const scaleApplied = Math.min(tier.maxDimension / longestSide, 8); // hard ceiling 8x
  return {
    width: Math.round(originalWidth * scaleApplied),
    height: Math.round(originalHeight * scaleApplied),
    scaleApplied,
  };
}
