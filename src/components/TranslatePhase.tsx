import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import React from 'react';
import type { LanguageProgress } from '../utils/types.js';

interface TranslatePhaseProps {
  progress: LanguageProgress[];
}

function ProgressBar({
  done,
  total,
  width,
}: {
  done: number;
  total: number;
  width: number;
}): React.JSX.Element {
  const filled = total > 0 ? Math.round((done / total) * width) : 0;
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Text>
      <Text color="green">{bar}</Text>
      <Text dimColor> {pct}%</Text>
    </Text>
  );
}

function StatusIcon({ status }: { status: LanguageProgress['status'] }): React.JSX.Element {
  switch (status) {
    case 'pending':
      return <Text dimColor>○ </Text>;
    case 'translating':
      return (
        <Text color="green">
          <Spinner type="dots" />{' '}
        </Text>
      );
    case 'done':
      return <Text color="green">✓ </Text>;
    case 'error':
      return <Text color="red">✗ </Text>;
  }
}

export function TranslatePhase({ progress }: TranslatePhaseProps): React.JSX.Element {
  const allDone = progress.every((p) => p.status === 'done' || p.status === 'error');

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {allDone ? '✓ Translation complete' : 'Translating...'}
        </Text>
      </Box>

      {progress.map((lang) => (
        <Box key={lang.langCode} flexDirection="column" marginBottom={1}>
          <Box>
            <StatusIcon status={lang.status} />
            <Text bold>{lang.langName}</Text>
            <Text dimColor> ({lang.langCode})</Text>
            <Text dimColor>
              {' '}
              — {lang.done}/{lang.total} strings
              {lang.failed > 0 && <Text color="red"> · {lang.failed} failed</Text>}
            </Text>
          </Box>

          {lang.total > 0 && (
            <Box marginLeft={2}>
              <ProgressBar done={lang.done} total={lang.total} width={30} />
            </Box>
          )}

          {lang.status === 'done' && lang.total === 0 && (
            <Box marginLeft={2}>
              <Text dimColor>No untranslated strings found</Text>
            </Box>
          )}

          {lang.errorMessage !== undefined && (
            <Box marginLeft={2}>
              <Text color="red">{lang.errorMessage}</Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
