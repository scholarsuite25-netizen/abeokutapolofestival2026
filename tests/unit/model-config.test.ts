import { describe, expect, it } from "vitest";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL_NAME,
  getModelConfig,
} from "@/lib/config/model-config";

describe("Model Configuration – Zero-Cost Local Model", () => {
  it("contains at least one model in the registry", () => {
    expect(AVAILABLE_MODELS.length).toBeGreaterThan(0);
  });

  it("contains the 'local-ollama' zero-cost model", () => {
    const model = AVAILABLE_MODELS.find((m) => m.name === "local-ollama");
    expect(model).toBeDefined();
  });

  it("'local-ollama' points to the local Ollama endpoint", () => {
    const model = AVAILABLE_MODELS.find((m) => m.name === "local-ollama");
    expect(model?.endpoint).toContain("localhost:11434");
  });

  it("'local-ollama' is marked as zeroCost: true", () => {
    const model = AVAILABLE_MODELS.find((m) => m.name === "local-ollama");
    expect(model?.zeroCost).toBe(true);
  });

  it("'local-ollama' requires no API key (apiKey is empty string or undefined)", () => {
    const model = AVAILABLE_MODELS.find((m) => m.name === "local-ollama");
    expect(model?.apiKey === "" || model?.apiKey === undefined).toBe(true);
  });

  it("DEFAULT_MODEL_NAME is set to 'local-ollama'", () => {
    expect(DEFAULT_MODEL_NAME).toBe("local-ollama");
  });

  it("getModelConfig('local-ollama') returns the correct model", () => {
    const cfg = getModelConfig("local-ollama");
    expect(cfg.name).toBe("local-ollama");
    expect(cfg.zeroCost).toBe(true);
  });

  it("getModelConfig with unknown name falls back to default model", () => {
    const cfg = getModelConfig("non-existent-model-xyz");
    expect(cfg.name).toBe(DEFAULT_MODEL_NAME);
  });
});
