import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { AIProvider, ProviderConfig } from './types.js';

export interface OpenAIProviderConfig extends ProviderConfig {
  /** Optional custom base URL (e.g. for Azure OpenAI or a proxy). */
  baseURL?: string;
}

/**
 * Adapter for the native OpenAI provider.
 * Uses @ai-sdk/openai under the hood.
 */
export function createOpenAIProvider(config: OpenAIProviderConfig): AIProvider {
  const provider = createOpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL !== undefined ? { baseURL: config.baseURL } : {}),
  });

  return {
    name: 'OpenAI',
    getModel() {
      return provider(config.model) satisfies LanguageModel;
    },
  };
}
