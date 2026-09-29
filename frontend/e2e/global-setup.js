import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default async function globalSetup() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const backendDir = path.resolve(currentDir, '../../backend');
  execFileSync('node', ['--env-file=.env.local', 'scripts/cleanup-e2e.js'], {
    cwd: backendDir,
    stdio: 'inherit',
  });
}
