"use client";

/**
 * ModelSelector Component
 * Abeokuta Polo Festival 2026 — The Blueprint
 *
 * Renders a dropdown selector in the Settings sidebar that allows the user to
 * switch between available AI models in Antigravity.
 *
 * Selecting "local-ollama" routes all generation requests to the local Ollama
 * endpoint at http://localhost:11434/api/generate, incurring zero API cost
 * and bypassing remote rate limits.
 */

import React, { useState } from "react";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL_NAME,
  ModelConfig,
} from "@/lib/config/model-config";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "antigravity_selected_model";

export const ModelSelector: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    // Use lazy initializer so we read localStorage only once at mount,
    // avoiding a setState-inside-effect lint error.
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_MODEL_NAME;
    }
    return DEFAULT_MODEL_NAME;
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedModel(name);
    localStorage.setItem(STORAGE_KEY, name);
  };

  const active: ModelConfig | undefined = AVAILABLE_MODELS.find(
    (m) => m.name === selectedModel
  );

  return (
    <div className="rounded-lg border border-[#B8860B]/30 bg-black/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#B8860B] uppercase tracking-wider">
          AI Model
        </h3>
        {active?.zeroCost && (
          <Badge className="bg-green-900/60 text-green-300 text-xs border-green-700">
            Zero Cost
          </Badge>
        )}
      </div>

      <select
        id="model-select"
        value={selectedModel}
        onChange={handleChange}
        className="w-full rounded-md border border-[#B8860B]/40 bg-black/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#B8860B]/60"
      >
        {AVAILABLE_MODELS.map((m) => (
          <option key={m.name} value={m.name}>
            {m.name}
            {m.zeroCost ? " (Free / Local)" : ""}
          </option>
        ))}
      </select>

      {active && (
        <p className="text-xs text-gray-400 leading-relaxed">
          {active.description}
          {active.zeroCost && (
            <span className="block mt-1 text-green-400">
              ✓ This model runs locally — no API rate limits apply.
            </span>
          )}
        </p>
      )}
    </div>
  );
};

export default ModelSelector;
