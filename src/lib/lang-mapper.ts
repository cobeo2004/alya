import {
  LANGUAGES_MAP_CODE2,
  SUPPORTED_APP_LANGUAGES_CONFIG,
  isSupportedAppLanguage,
} from '../utils';

/**
 * Get the human-readable language name for a given folder name (language code).
 *
 * Handles:
 * - Simple 2-letter codes: "vi" → "Vietnamese"
 * - Compound codes: "zh-CN" → "Chinese (Simplified)"
 * - Returns null for unknown or skipped languages (e.g. "en" source language)
 */
export function getLanguageName(folderName: string): string | null {
  // Skip English — it's the source language
  if (folderName === 'en') {
    return null;
  }

  // First check the app-supported languages config (handles zh-CN, zh-HK, zh-TW)
  if (isSupportedAppLanguage(folderName)) {
    const config = SUPPORTED_APP_LANGUAGES_CONFIG.find((c) => c.code2 === folderName);
    if (config !== undefined) {
      return config.name;
    }
  }

  // Fall back to the full language map for simple 2-letter codes
  const lang = LANGUAGES_MAP_CODE2[folderName];
  if (lang !== undefined && lang.name !== '') {
    return lang.name;
  }

  return null;
}
