import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFilePath), '..');
const targetRoot = path.join(projectRoot, 'obj');
const configurations = new Set(['Debug', 'Release']);

async function ensureAngularBuildDirectories() {
  await mkdir(targetRoot, { recursive: true });

  for (const configuration of configurations) {
    const configurationPath = path.join(targetRoot, configuration);
    await mkdir(configurationPath, { recursive: true });
  }
}

try {
  await ensureAngularBuildDirectories();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Failed to prepare Angular build directories: ${message}\n`);
  process.exitCode = 1;
}
