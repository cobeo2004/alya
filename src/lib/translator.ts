import { generateObject } from 'ai';
import { z } from 'zod';
import type { Config } from '../utils/config.js';
import type { AIProvider } from '../providers/types.js';
import type { PoEntry, PoFile, TranslationResult } from '../utils/types.js';
import { chunk, processWithConcurrency } from './concurrency.js';
import { getUntranslatedEntries, writePoFile } from './po-parser.js';

const translationResponseSchema = z.object({
  translations: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      msgstr: z.string(),
    }),
  ),
});

type TranslationResponse = z.infer<typeof translationResponseSchema>;

interface TranslationChunkResult {
  index: number;
  msgstr: string;
}

/**
 * Build the system prompt for a given target language.
 */
function buildSystemPrompt(langName: string): string {
  return [
    `You are a professional translator specializing in software UI localization.`,
    `Translate the provided English strings into ${langName}.`,
    ``,
    `Rules:`,
    `- Preserve ALL placeholders exactly as they appear (e.g., {0}, {1}, {name}, {priceDisplay}).`,
    `- Do NOT translate brand names: "Unibuz", "Unibazaar".`,
    `- Match the tone and brevity of the original (UI labels should stay concise).`,
    `- Return translations in the exact same order as the input.`,
    `- Respond only with the JSON object containing the translations array.`,
  ].join('\n');
}

/**
 * Translate a chunk of entries using the injected AI provider.
 * Returns a map of index → translated string.
 */
async function translateChunk(
  entries: PoEntry[],
  startIndex: number,
  langName: string,
  provider: AIProvider,
): Promise<TranslationChunkResult[]> {
  const model = provider.getModel();

  const promptLines = entries.map(
    (entry, i) => `${startIndex + i}. "${entry.msgid.replace(/"/g, '\\"')}"`,
  );

  const userPrompt = [
    `Translate the following ${entries.length} strings from English to ${langName}:`,
    ``,
    ...promptLines,
    ``,
    `Return a JSON object with a "translations" array where each element has:`,
    `- "index": the number from the list above (0-based)`,
    `- "msgstr": the translated string`,
  ].join('\n');

  const { object } = await generateObject({
    model,
    schema: translationResponseSchema,
    system: buildSystemPrompt(langName),
    prompt: userPrompt,
  });

  const validated = object satisfies TranslationResponse;
  return validated.translations;
}

/**
 * Translate all untranslated entries in a .po file.
 *
 * @param poFile    - The parsed .po file
 * @param provider  - The AI provider adapter to use for translation
 * @param config    - App configuration (used for batch/chunk sizes)
 * @param onProgress - Called after each chunk completes with the count of strings translated
 * @returns A TranslationResult summarizing what happened
 */
export async function translatePoFile(
  poFile: PoFile,
  provider: AIProvider,
  config: Config,
  onProgress: (translated: number, failed: number) => void,
): Promise<TranslationResult> {
  const untranslated = getUntranslatedEntries(poFile);

  if (untranslated.length === 0) {
    return {
      langCode: poFile.langCode,
      langName: poFile.langName,
      translated: 0,
      failed: 0,
    };
  }

  const chunks = chunk(untranslated, config.chunkSize);
  const translationMap = new Map<string, string>();
  let totalTranslated = 0;
  let totalFailed = 0;

  // Process chunks with controlled concurrency
  await processWithConcurrency(
    chunks.map((chunkEntries, chunkIdx) => ({ chunkEntries, chunkIdx })),
    config.batchSize,
    async ({ chunkEntries, chunkIdx }) => {
      const startIndex = chunkIdx * config.chunkSize;
      try {
        const results = await translateChunk(chunkEntries, startIndex, poFile.langName, provider);

        for (const result of results) {
          const localIndex = result.index - startIndex;
          const entry = chunkEntries[localIndex];
          if (entry !== undefined && result.msgstr.trim() !== '') {
            translationMap.set(entry.msgid, result.msgstr);
            totalTranslated++;
          } else {
            totalFailed++;
          }
        }
      } catch {
        totalFailed += chunkEntries.length;
      }
      onProgress(totalTranslated, totalFailed);
    },
  );

  // Write translations back to disk
  try {
    await writePoFile(poFile, translationMap);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      langCode: poFile.langCode,
      langName: poFile.langName,
      translated: totalTranslated,
      failed: totalFailed,
      error: `Failed to write file: ${errorMessage}`,
    };
  }

  return {
    langCode: poFile.langCode,
    langName: poFile.langName,
    translated: totalTranslated,
    failed: totalFailed,
  };
}
