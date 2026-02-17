import fs from 'fs/promises';
import type { PoComment, PoEntry, PoFile } from '../utils/types.js';

// ─── Regex Patterns ───────────────────────────────────────────────────────────

const COMMENT_TRANSLATOR_RE = /^# (.*)$/;
const COMMENT_EXTRACTED_RE = /^#\. (.*)$/;
const COMMENT_REFERENCE_RE = /^#: (.*)$/;
const COMMENT_FLAG_RE = /^#, (.*)$/;
const MSGID_RE = /^msgid "(.*)"$/;
const MSGSTR_RE = /^msgstr "(.*)"$/;
const CONTINUATION_RE = /^"(.*)"$/;

/**
 * Unescape a PO string value (handles \n, \t, \\, \").
 */
function unescapePo(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"');
}

/**
 * Escape a string for use in a PO file.
 */
function escapePo(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
}

/**
 * Check if a msgid contains only placeholder tokens and no translatable text.
 * Examples that are placeholder-only: "{0}", "{priceDisplay}", "{0} {1}"
 */
export function isPlaceholderOnly(msgid: string): boolean {
  if (msgid === '') return true;
  // Remove all placeholder tokens
  const stripped = msgid.replace(/\{[^}]+\}/g, '').trim();
  // If nothing remains (or only punctuation/whitespace), it's a placeholder-only entry
  return stripped.length === 0;
}

function emptyComment(): PoComment {
  return { translator: [], extracted: [], references: [], flags: [] };
}

type ParserState = 'idle' | 'msgid' | 'msgstr';

/**
 * Parse a .po file content into structured PoEntry objects.
 */
export function parsePo(content: string): PoEntry[] {
  const lines = content.split('\n');
  const entries: PoEntry[] = [];

  let state: ParserState = 'idle';
  let currentComments = emptyComment();
  let currentMsgid = '';
  let currentMsgstr = '';
  let inEntry = false;

  const flushEntry = (): void => {
    if (!inEntry) return;
    entries.push({
      comments: currentComments,
      msgid: unescapePo(currentMsgid),
      msgstr: unescapePo(currentMsgstr),
      isHeader: currentMsgid === '',
    });
    currentComments = emptyComment();
    currentMsgid = '';
    currentMsgstr = '';
    inEntry = false;
    state = 'idle';
  };

  for (const line of lines) {
    // Blank line = entry separator
    if (line.trim() === '') {
      if (inEntry && state !== 'idle') {
        flushEntry();
      }
      continue;
    }

    // Comment lines
    const translatorMatch = COMMENT_TRANSLATOR_RE.exec(line);
    if (translatorMatch !== null) {
      if (inEntry) flushEntry();
      currentComments.translator.push(translatorMatch[1] ?? '');
      continue;
    }

    const extractedMatch = COMMENT_EXTRACTED_RE.exec(line);
    if (extractedMatch !== null) {
      if (inEntry) flushEntry();
      currentComments.extracted.push(extractedMatch[1] ?? '');
      continue;
    }

    const referenceMatch = COMMENT_REFERENCE_RE.exec(line);
    if (referenceMatch !== null) {
      if (inEntry) flushEntry();
      currentComments.references.push(referenceMatch[1] ?? '');
      continue;
    }

    const flagMatch = COMMENT_FLAG_RE.exec(line);
    if (flagMatch !== null) {
      if (inEntry) flushEntry();
      currentComments.flags.push(flagMatch[1] ?? '');
      continue;
    }

    // msgid line
    const msgidMatch = MSGID_RE.exec(line);
    if (msgidMatch !== null) {
      if (inEntry && state === 'msgstr') {
        flushEntry();
      }
      inEntry = true;
      state = 'msgid';
      currentMsgid = msgidMatch[1] ?? '';
      continue;
    }

    // msgstr line
    const msgstrMatch = MSGSTR_RE.exec(line);
    if (msgstrMatch !== null) {
      state = 'msgstr';
      currentMsgstr = msgstrMatch[1] ?? '';
      continue;
    }

    // Continuation line (multiline string)
    const continuationMatch = CONTINUATION_RE.exec(line);
    if (continuationMatch !== null) {
      const chunk = continuationMatch[1] ?? '';
      if (state === 'msgid') {
        currentMsgid += chunk;
      } else if (state === 'msgstr') {
        currentMsgstr += chunk;
      }
      continue;
    }
  }

  // Flush last entry
  if (inEntry) {
    flushEntry();
  }

  return entries;
}

/**
 * Serialize a list of PoEntry objects back to .po file format.
 */
export function serializePo(entries: PoEntry[]): string {
  const parts: string[] = [];

  for (const entry of entries) {
    const lines: string[] = [];

    // Write comments
    for (const c of entry.comments.translator) {
      lines.push(`# ${c}`);
    }
    for (const c of entry.comments.extracted) {
      lines.push(`#. ${c}`);
    }
    for (const c of entry.comments.references) {
      lines.push(`#: ${c}`);
    }
    for (const c of entry.comments.flags) {
      lines.push(`#, ${c}`);
    }

    lines.push(`msgid "${escapePo(entry.msgid)}"`);
    lines.push(`msgstr "${escapePo(entry.msgstr)}"`);

    parts.push(lines.join('\n'));
  }

  return parts.join('\n\n') + '\n';
}

/**
 * Read and parse a .po file from disk.
 */
export async function readPoFile(
  filePath: string,
  langCode: string,
  langName: string,
): Promise<PoFile> {
  const content = await fs.readFile(filePath, 'utf-8');
  const entries = parsePo(content);
  return { filePath, langCode, langName, entries };
}

/**
 * Write translated entries back to the .po file.
 * Only updates entries where the msgid is found and msgstr was changed.
 */
export async function writePoFile(
  poFile: PoFile,
  translations: Map<string, string>,
): Promise<void> {
  const updatedEntries = poFile.entries.map((entry): PoEntry => {
    const translated = translations.get(entry.msgid);
    if (translated !== undefined && translated.trim() !== '') {
      return { ...entry, msgstr: translated };
    }
    return entry;
  });

  const serialized = serializePo(updatedEntries);
  await fs.writeFile(poFile.filePath, serialized, 'utf-8');
}

/**
 * Get all untranslated entries from a PoFile.
 * Excludes the header entry and placeholder-only entries.
 */
export function getUntranslatedEntries(poFile: PoFile): PoEntry[] {
  return poFile.entries.filter(
    (entry) => !entry.isHeader && entry.msgstr === '' && !isPlaceholderOnly(entry.msgid),
  );
}
