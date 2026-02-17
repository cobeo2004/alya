import { Box, useApp } from 'ink';
import InkPicture from 'ink-picture';
import path from 'path';
import { fileURLToPath } from 'url';
import React, { useEffect, useState } from 'react';
import { ScanPhase } from './components/ScanPhase.js';
import { SummaryPhase } from './components/SummaryPhase.js';
import { TranslatePhase } from './components/TranslatePhase.js';
import type { Config } from './utils/config.js';
import { getLanguageName } from './lib/lang-mapper.js';
import { getUntranslatedEntries, readPoFile } from './lib/po-parser.js';
import { scanDirectory } from './lib/scanner.js';
import { translatePoFile } from './lib/translator.js';
import { resolveProvider } from './providers/index.js';
import type {
  AppPhase,
  LanguageProgress,
  PoFile,
  ScannedFile,
  TranslationResult,
} from './utils/types.js';

interface AppProps {
  config: Config;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, 'assets/alya.svg');

export function App({ config }: AppProps): React.JSX.Element {
  const { exit } = useApp();
  const [phase, setPhase] = useState<AppPhase>('scan');
  const [isScanning, setIsScanning] = useState(true);
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [skippedFiles, setSkippedFiles] = useState<string[]>([]);
  const [langProgress, setLangProgress] = useState<LanguageProgress[]>([]);
  const [results, setResults] = useState<TranslationResult[]>([]);

  // ─── Phase 1: Scan ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function runScan(): Promise<void> {
      const found = await scanDirectory(config.scanRoot, config.fileExtensions, config.scanExclude);

      const validFiles: ScannedFile[] = [];
      const skipped: string[] = [];

      for (const file of found) {
        const langName = getLanguageName(file.folderName);
        if (langName === null) {
          // Skip English or unknown languages
          skipped.push(file.filePath);
        } else {
          validFiles.push(file);
        }
      }

      setScannedFiles(validFiles);
      setSkippedFiles(skipped);
      setIsScanning(false);

      // Move to translate phase after a short pause to show scan results
      await new Promise<void>((resolve) => setTimeout(resolve, 800));

      if (validFiles.length === 0) {
        exit();
        return;
      }

      setPhase('translate');
    }

    void runScan();
  }, []); // intentionally run once on mount

  // ─── Phase 2: Translate ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'translate') return;

    async function runTranslation(): Promise<void> {
      // Create the AI provider once — shared across all translation tasks
      const provider = resolveProvider(config);

      // Parse all .po files and set up initial progress
      const poFiles: PoFile[] = await Promise.all(
        scannedFiles.map((file: ScannedFile) => {
          const langName = getLanguageName(file.folderName) ?? file.folderName;
          return readPoFile(file.filePath, file.folderName, langName);
        }),
      );

      const initialProgress: LanguageProgress[] = poFiles.map((pf: PoFile) => ({
        langCode: pf.langCode,
        langName: pf.langName,
        total: getUntranslatedEntries(pf).length,
        done: 0,
        failed: 0,
        status: 'pending' as const,
      }));

      setLangProgress(initialProgress);

      // Translate each language with bounded concurrency
      const allResults: TranslationResult[] = [];

      // Process languages concurrently using the batchSize as the concurrency limit
      const queue = [...poFiles];
      const workers = Array.from({ length: Math.min(config.batchSize, queue.length) }, async () => {
        while (queue.length > 0) {
          const poFile = queue.shift();
          if (poFile === undefined) break;

          // Mark this language as translating
          setLangProgress((prev: LanguageProgress[]) =>
            prev.map((p: LanguageProgress) =>
              p.langCode === poFile.langCode ? { ...p, status: 'translating' as const } : p,
            ),
          );

          const result = await translatePoFile(
            poFile,
            provider,
            config,
            (translated: number, failed: number) => {
              setLangProgress((prev: LanguageProgress[]) =>
                prev.map((p: LanguageProgress) =>
                  p.langCode === poFile.langCode ? { ...p, done: translated, failed } : p,
                ),
              );
            },
          );

          allResults.push(result);

          const hasError = result.error !== undefined;
          setLangProgress((prev: LanguageProgress[]) =>
            prev.map((p: LanguageProgress) =>
              p.langCode === poFile.langCode
                ? {
                    ...p,
                    done: result.translated,
                    failed: result.failed,
                    status: hasError ? ('error' as const) : ('done' as const),
                    errorMessage: result.error,
                  }
                : p,
            ),
          );
        }
      });

      await Promise.all(workers);
      setResults(allResults);

      // Short pause to show final translation state before summary
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      setPhase('summary');
    }

    void runTranslation();
  }, [phase]); // intentionally only reacts to phase changes

  // ─── Phase 3: Summary → exit ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'summary') return;
    // Give a moment for the summary to render, then exit
    const timer = setTimeout(() => exit(), 200);
    return () => clearTimeout(timer);
  }, [phase, exit]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} width={40} height={20}>
        <InkPicture src={logoPath} width={40} height={20} protocol='auto' />
      </Box>
      {phase === 'scan' && (
        <ScanPhase
          isScanning={isScanning}
          scannedFiles={scannedFiles}
          skippedFiles={skippedFiles}
          scanRoot={config.scanRoot}
        />
      )}
      {phase === 'translate' && <TranslatePhase progress={langProgress} />}
      {phase === 'summary' && <SummaryPhase results={results} />}
    </Box>
  );
}
