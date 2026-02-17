import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';
import type { AIProvider, ProviderConfig } from './types.js';

export interface OpenAICompatProviderConfig extends ProviderConfig {
  baseURL: string;
}

/**
 * Adapter for any OpenAI-compatible API (e.g. LM Studio, Ollama, Together AI).
 * Uses @ai-sdk/openai-compatible under the hood.
 */
export function createOpenAICompatProvider(config: OpenAICompatProviderConfig): AIProvider {
  const provider = createOpenAICompatible({
    name: 'openai-compatible',
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  return {
    name: 'OpenAI-Compatible',
    getModel() {
      return provider(config.model) satisfies LanguageModel;
    },
  };
}
