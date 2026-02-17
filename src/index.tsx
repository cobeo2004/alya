import { config as dotenvConfig } from 'dotenv';
import { render } from 'ink';
import { TerminalInfoProvider } from 'ink-picture';
import path from 'path';
import { fileURLToPath } from 'url';
import { App } from './app.js';
import { loadConfig } from './utils/config.js';

// Load .env from the app root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.resolve(__dirname, '..', '.env') });

async function main(): Promise<void> {
  let appConfig;
  try {
    appConfig = loadConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Configuration error: ${message}\n`);
    process.exit(1);
  }

  const { waitUntilExit } = render(
    <TerminalInfoProvider>
      <App config={appConfig} />
    </TerminalInfoProvider>,
  );
  await waitUntilExit();
}

main();
