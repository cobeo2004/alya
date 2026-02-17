import { Box, Text } from 'ink';
import React from 'react';
import type { TranslationResult } from '../utils/types.js';

interface SummaryPhaseProps {
  results: TranslationResult[];
}

export function SummaryPhase({ results }: SummaryPhaseProps): React.JSX.Element {
  const totalTranslated = results.reduce((sum, r) => sum + r.translated, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const hasErrors = results.some((r) => r.error !== undefined || r.failed > 0);

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ── Summary ──────────────────────────────
        </Text>
      </Box>

      {results.map((result) => (
        <Box key={result.langCode} flexDirection="column" marginBottom={1}>
          <Box>
            {result.error !== undefined ? (
              <Text color="red">✗ </Text>
            ) : result.failed > 0 ? (
              <Text color="yellow">⚠ </Text>
            ) : (
              <Text color="green">✓ </Text>
            )}
            <Text bold>{result.langName}</Text>
            <Text dimColor> ({result.langCode})</Text>
          </Box>

          <Box marginLeft={2} flexDirection="column">
            {result.translated > 0 && (
              <Text color="green">Translated: {result.translated} string(s)</Text>
            )}
            {result.failed > 0 && <Text color="yellow">Failed: {result.failed} string(s)</Text>}
            {result.translated === 0 && result.failed === 0 && result.error === undefined && (
              <Text dimColor>No untranslated strings</Text>
            )}
            {result.error !== undefined && <Text color="red">Error: {result.error}</Text>}
          </Box>
        </Box>
      ))}

      <Box
        marginTop={1}
        borderStyle="single"
        borderColor={hasErrors ? 'yellow' : 'green'}
        paddingX={1}>
        <Box flexDirection="column">
          <Text bold>
            Total: {totalTranslated} translated
            {totalFailed > 0 && <Text color="yellow">, {totalFailed} failed</Text>}
          </Text>
          {!hasErrors && <Text color="green">All translations completed successfully!</Text>}
          {hasErrors && (
            <Text color="yellow">
              Translation completed with some failures. Check the output above for details.
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}
