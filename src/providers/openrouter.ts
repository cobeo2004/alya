import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';
import type { AIProvider, ProviderConfig } from './types.js';

export type OpenRouterProviderConfig = ProviderConfig;

/**
 * Adapter for OpenRouter — a unified API gateway to hundreds of models.
 * Uses @openrouter/ai-sdk-provider under the hood.
 *
 * Model IDs use the format: "provider/model-name"
 * e.g. "anthropic/claude-sonnet-4", "openai/gpt-4o", "google/gemini-2.0-flash"
 */
export function createOpenRouterProvider(config: OpenRouterProviderConfig): AIProvider {
  const provider = createOpenRouter({
    apiKey: config.apiKey,
  });

  return {
    name: 'OpenRouter',
    getModel() {
      return provider(config.model) satisfies LanguageModel;
    },
  };
}
