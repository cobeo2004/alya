import type { LanguageModel } from 'ai';

/**
 * Adapter interface for AI model providers.
 *
 * Each provider implementation wraps a specific SDK (OpenAI, OpenRouter, etc.)
 * and exposes a unified way to obtain a LanguageModel for use with the AI SDK.
 */
export interface AIProvider {
  /** Display name for logging/UI (e.g. "OpenAI", "OpenRouter") */
  readonly name: string;
  /** Returns a configured language model ready for generateObject() / generateText() */
  getModel(): LanguageModel;
}

/**
 * Base input interface for AI model providers
 * Can extends from this for baseUrl
 */
export interface ProviderConfig {
  /** API key for the selected provider */
  apiKey: string;
  /** Optional base URL for the API endpoint */
  baseUrl?: string;
  /** Model identifier */
  model: string;
}
