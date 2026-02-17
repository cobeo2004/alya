import path from 'path';

export interface Config {
  /** Which AI provider adapter to use: "openai" | "openrouter" | "openai-compat" */
  aiProvider: string;
  /** API key for the selected provider */
  aiApiKey: string;
  /**
   * Base URL for the API endpoint.
   * Required for "openai-compat"; optional override for "openai".
   * Unused for "openrouter".
   */
  aiBaseUrl: string;
  /** Model identifier (e.g. "gpt-4o", "anthropic/claude-sonnet-4") */
  aiModel: string;
  scanRoot: string;
  scanExclude: string[];
  fileExtensions: string[];
  batchSize: number;
  chunkSize: number;
  /**
   * Optional custom instructions appended to the system prompt.
   * Set via CUSTOM_PROMPT env var. Useful for adding domain-specific rules,
   * brand names to preserve, tone guidelines, etc.
   */
  customPrompt: string;
}

function getEnvString(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value !== undefined && value !== '') {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Missing required environment variable: ${key}`);
}

function getEnvStringOptional(key: string, defaultValue: string): string {
  const value = process.env[key];
  if (value !== undefined && value !== '') {
    return value;
  }
  return defaultValue;
}

function getEnvInt(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer, got: ${raw}`);
  }
  return parsed;
}

function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function loadConfig(): Config {
  const scanRootRaw = getEnvStringOptional('SCAN_ROOT', process.cwd());
  const scanRoot = path.isAbsolute(scanRootRaw)
    ? scanRootRaw
    : path.resolve(process.cwd(), scanRootRaw);

  const scanExcludeRaw = getEnvStringOptional('SCAN_EXCLUDE', 'node_modules,.git,dist');
  const fileExtensionsRaw = getEnvStringOptional('FILE_EXTENSIONS', '.po');

  return {
    aiProvider: getEnvStringOptional('AI_PROVIDER', 'openai-compat'),
    aiApiKey: getEnvString('AI_API_KEY'),
    aiBaseUrl: getEnvStringOptional('AI_BASE_URL', ''),
    aiModel: getEnvString('AI_MODEL'),
    scanRoot,
    scanExclude: parseCommaSeparated(scanExcludeRaw),
    fileExtensions: parseCommaSeparated(fileExtensionsRaw),
    batchSize: getEnvInt('BATCH_SIZE', 5),
    chunkSize: getEnvInt('CHUNK_SIZE', 30),
    customPrompt: getEnvStringOptional('CUSTOM_PROMPT', ''),
  };
}
