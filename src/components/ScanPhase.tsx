import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import React from 'react';
import type { ScannedFile } from '../utils/types.js';

interface ScanPhaseProps {
  isScanning: boolean;
  scannedFiles: ScannedFile[];
  skippedFiles: string[];
  scanRoot: string;
}

export function ScanPhase({
  isScanning,
  scannedFiles,
  skippedFiles,
  scanRoot,
}: ScanPhaseProps): React.JSX.Element {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Alya - Your Alisa for Localization
        </Text>
      </Box>

      <Box>
        {isScanning ? (
          <>
            <Text color="green">
              <Spinner type="dots" />
            </Text>
            <Text> Scanning </Text>
            <Text color="yellow">{scanRoot}</Text>
            <Text> for localization files...</Text>
          </>
        ) : (
          <Text color="green">✓ Scan complete</Text>
        )}
      </Box>

      {!isScanning && scannedFiles.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>
            Found {scannedFiles.length} file(s) across {getUniqueFolders(scannedFiles)} language(s):
          </Text>
          {scannedFiles.map((file) => (
            <Box key={file.filePath} marginLeft={2}>
              <Text color="green">• </Text>
              <Text dimColor>{file.filePath}</Text>
            </Box>
          ))}
        </Box>
      )}

      {!isScanning && scannedFiles.length === 0 && (
        <Box marginTop={1}>
          <Text color="yellow">No localization files found in {scanRoot}</Text>
        </Box>
      )}

      {skippedFiles.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor color="yellow">
            Skipped {skippedFiles.length} file(s) with unknown language codes:
          </Text>
          {skippedFiles.map((f) => (
            <Box key={f} marginLeft={2}>
              <Text dimColor>• {f}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function getUniqueFolders(files: ScannedFile[]): number {
  return new Set(files.map((f) => f.folderName)).size;
}
