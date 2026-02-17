// ─── PO File Structures ───────────────────────────────────────────────────────

export interface PoComment {
  /** Translator comments: lines starting with "# " */
  translator: string[];
  /** Extracted comments: lines starting with "#." */
  extracted: string[];
  /** Reference comments: lines starting with "#:" */
  references: string[];
  /** Flag comments: lines starting with "#," */
  flags: string[];
}

export interface PoEntry {
  /** All comment lines preceding this entry, in order */
  comments: PoComment;
  /** The source string (English) */
  msgid: string;
  /** The translated string (empty = untranslated) */
  msgstr: string;
  /** True if this is the header entry (msgid is empty string) */
  isHeader: boolean;
}

export interface PoFile {
  /** Absolute path to the .po file */
  filePath: string;
  /** Language code derived from folder name (e.g. "vi", "zh-CN") */
  langCode: string;
  /** Human-readable language name (e.g. "Vietnamese") */
  langName: string;
  /** All parsed entries including header */
  entries: PoEntry[];
}

// ─── Scanner Structures ───────────────────────────────────────────────────────

export interface ScannedFile {
  /** Absolute path to the file */
  filePath: string;
  /** The immediate parent folder name (used as language code) */
  folderName: string;
}

// ─── Translation Structures ───────────────────────────────────────────────────

export interface TranslationTask {
  /** The .po file to translate */
  poFile: PoFile;
  /** Entries that need translation (msgstr is empty, not a placeholder) */
  untranslatedEntries: PoEntry[];
}

export interface TranslationResult {
  /** Language code */
  langCode: string;
  /** Language name */
  langName: string;
  /** Number of strings successfully translated */
  translated: number;
  /** Number of strings that failed to translate */
  failed: number;
  /** Error message if the whole task failed */
  error?: string;
}

// ─── App State ────────────────────────────────────────────────────────────────

export type AppPhase = 'scan' | 'translate' | 'summary';

export interface LanguageProgress {
  langCode: string;
  langName: string;
  total: number;
  done: number;
  failed: number;
  status: 'pending' | 'translating' | 'done' | 'error';
  errorMessage?: string;
}
