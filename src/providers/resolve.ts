import type { Config } from '../utils/config.js';
import { createOpenAICompatProvider } from './openai-compat.js';
import { createOpenAIProvider } from './openai.js';
import { createOpenRouterProvider } from './openrouter.js';
import type { AIProvider } from './types.js';

/**
 * Resolves the configured AI provider from the app config.
 *
 * Supported values for `config.aiProvider`:
 *   - "openai"        — Native OpenAI provider (@ai-sdk/openai)
 *   - "openrouter"    — OpenRouter gateway (@openrouter/ai-sdk-provider)
 *   - "openai-compat" — Generic OpenAI-compatible endpoint (@ai-sdk/openai-compatible)
 *
 * @throws {Error} if an unsupported provider name is given
 */
export function resolveProvider(config: Config): AIProvider {
  switch (config.aiProvider) {
    case 'openai':
      return createOpenAIProvider({
        apiKey: config.aiApiKey,
        model: config.aiModel,
        baseURL: config.aiBaseUrl !== '' ? config.aiBaseUrl : undefined,
      });

    case 'openrouter':
      return createOpenRouterProvider({
        apiKey: config.aiApiKey,
        model: config.aiModel,
      });

    case 'openai-compat':
      return createOpenAICompatProvider({
        apiKey: config.aiApiKey,
        model: config.aiModel,
        baseURL: config.aiBaseUrl,
      });

    default:
      throw new Error(
        `Unsupported AI_PROVIDER: "${config.aiProvider}". ` +
          `Valid options are: "openai", "openrouter", "openai-compat".`,
      );
  }
}
