/**
 * Antigravity Model Configuration
 * Abeokuta Polo Festival 2026 — The Blueprint
 *
 * Defines compatible AI model entries for Antigravity.
 * Adding a local (zero-cost) model here allows the app to route
 * AI generation tasks to a local Ollama endpoint, bypassing remote
 * API rate limits at zero cost.
 */

export interface ModelConfig {
  /** Unique identifier used to select the model (e.g., "local-ollama"). */
  name: string;
  /** HTTP endpoint that handles generation requests. */
  endpoint: string;
  /** API key for authentication. Leave empty for local/unauthenticated models. */
  apiKey?: string;
  /** Human-readable description shown in the model selector UI. */
  description?: string;
  /** If true, this model incurs no external API costs (e.g., local Ollama). */
  zeroCost?: boolean;
}

/**
 * All available AI models for Antigravity.
 * Models marked zeroCost: true are served locally and avoid rate limits.
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    name: "local-ollama",
    endpoint: "http://localhost:11434/api/generate",
    apiKey: "",
    description: "Local Ollama model – zero cost, no rate limits",
    zeroCost: true,
  },
];

/**
 * Default model selected on first use.
 * Points to the local Ollama model by default to avoid remote rate limits.
 */
export const DEFAULT_MODEL_NAME = "local-ollama";

/**
 * Returns a model config by name. Falls back to the default model if not found.
 */
export function getModelConfig(name: string): ModelConfig {
  return (
    AVAILABLE_MODELS.find((m) => m.name === name) ??
    AVAILABLE_MODELS.find((m) => m.name === DEFAULT_MODEL_NAME) ??
    AVAILABLE_MODELS[0]
  );
}

