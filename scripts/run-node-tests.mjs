import { spawnSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', 'test');

function collectTestJs(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) collectTestJs(p, acc);
    else if (ent.isFile() && ent.name.endsWith('.test.js')) acc.push(p);
  }
  return acc;
}

const files = collectTestJs(root).sort();
if (files.length === 0) {
  console.error(
    'No compiled tests under dist/test (*.test.js). Run tsc -p tsconfig.test.json first.',
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(result.status === null ? 1 : result.status);
