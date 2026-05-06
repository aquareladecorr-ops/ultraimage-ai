/**
 * Ultra Engine — UltraImage AI's image processing service.
 *
 * This module abstracts the underlying AI provider behind a clean,
 * provider-agnostic interface. The current implementation uses Replicate
 * but the rest of the application MUST NOT depend on this fact.
 *
 * To swap providers (e.g., to Fal.ai or a self-hosted model), only this
 * file needs to change.
 */

import Replicate from "replicate";
import type { ResolutionTier } from "@/config/credits";

// ============================================================================
// Public Types — used throughout the app
// ============================================================================

export type UpscaleRequest = {
  /** URL the provider can fetch (presigned R2 URL) */
  imageUrl: string;
  /** Original image dimensions */
  originalWidth: number;
  originalHeight: number;
  /** Selected resolution tier */
  tier: ResolutionTier;
  /** Optional: webhook URL for async notification */
  webhookUrl?: string;
};

export type UpscaleResult = {
  externalJobId: string;
  resultUrl: string;
  processingTimeMs: number;
  resultWidth?: number;
  resultHeight?: number;
};

export class UpscaleError extends Error {
  constructor(message: string, public code: string, public retryable: boolean = false) {
    super(message);
    this.name = "UpscaleError";
  }
}

// ============================================================================
// Internal Implementation (Replicate adapter — never exposed externally)
// ============================================================================

class UpscalerService {
  private client: Replicate;

  constructor() {
    if (!process.env.AI_PROVIDER_API_KEY) {
      throw new Error("AI_PROVIDER_API_KEY is not set");
    }
    this.client = new Replicate({ auth: process.env.AI_PROVIDER_API_KEY });
  }

  /**
   * Run an upscale operation. This is BLOCKING — it waits until completion.
   * For high-volume production, prefer `runAsync` with webhooks.
   */
  async run(req: UpscaleRequest): Promise<UpscaleResult> {
    const startedAt = Date.now();
    const modelVersion = process.env.AI_PROVIDER_MODEL_VERSION;
    if (!modelVersion) throw new UpscaleError("Model version not configured", "CONFIG_ERROR");

    // Calculate scale factor based on the tier's max dimension
    const longestSide = Math.max(req.originalWidth, req.originalHeight);
    const scale = Math.min(req.tier.maxDimension / longestSide, 8);

    try {
      const output = await this.client.run(
        modelVersion as `${string}/${string}:${string}`,
        {
          input: {
            image: req.imageUrl,
            scale_factor: Math.max(2, Math.round(scale)),
            // Tuned defaults — adjust per model contract
            dynamic: 6,
            creativity: 0.35,
            resemblance: 0.6,
            num_inference_steps: 18,
            output_format: "jpg",
            output_quality: 95,
          },
        }
      );

      // Output shape varies per model. Normalize:
      const resultUrl = this.extractResultUrl(output);
      if (!resultUrl) {
        throw new UpscaleError("Provider returned no result URL", "EMPTY_RESULT", true);
      }

      return {
        externalJobId: this.generateInternalId(),
        resultUrl,
        processingTimeMs: Date.now() - startedAt,
      };
    } catch (err) {
      if (err instanceof UpscaleError) throw err;
      const message = err instanceof Error ? err.message : "Unknown processing error";
      throw new UpscaleError(message, "PROVIDER_ERROR", true);
    }
  }

  /**
   * Async variant that returns immediately with an external job id.
   * The provider will POST to `webhookUrl` when done.
   */
  async runAsync(req: UpscaleRequest): Promise<{ externalJobId: string }> {
    const modelVersion = process.env.AI_PROVIDER_MODEL_VERSION;
    if (!modelVersion) throw new UpscaleError("Model version not configured", "CONFIG_ERROR");
    if (!req.webhookUrl) throw new UpscaleError("Webhook URL required for async", "CONFIG_ERROR");

    const longestSide = Math.max(req.originalWidth, req.originalHeight);
    const scale = Math.min(req.tier.maxDimension / longestSide, 8);
    const [owner, modelAndVersion] = modelVersion.split("/");
    const [, version] = modelAndVersion?.split(":") ?? [];

    const prediction = await this.client.predictions.create({
      version: version!,
      input: {
        image: req.imageUrl,
        scale_factor: Math.max(2, Math.round(scale)),
        dynamic: 6,
        creativity: 0.35,
        resemblance: 0.6,
        num_inference_steps: 18,
        output_format: "jpg",
        output_quality: 95,
      },
      webhook: req.webhookUrl,
      webhook_events_filter: ["completed"],
    });

    return { externalJobId: prediction.id };
  }

  private extractResultUrl(output: unknown): string | null {
    if (typeof output === "string") return output;
    if (Array.isArray(output) && typeof output[0] === "string") return output[0];
    if (output && typeof output === "object" && "output" in output) {
      const inner = (output as { output: unknown }).output;
      return this.extractResultUrl(inner);
    }
    return null;
  }

  private generateInternalId(): string {
    return `ue_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

// Singleton instance
export const upscaler = new UpscalerService();
