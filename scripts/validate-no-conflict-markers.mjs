import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Usa git para listar arquivos versionados (não depende de ripgrep instalado).
const files = execSync('git ls-files', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

// Marcadores clássicos + restos de resoluções mal feitas (nomes de branch soltos numa linha).
const markerRegex = /^(<<<<<<<\s+.+|=======|>>>>>>>\s+.+|\s*codex\/[a-z0-9-]+\s*)$/m;
let failed = false;

for (const file of files) {
  if (file === 'scripts/validate-no-conflict-markers.mjs') continue;
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (markerRegex.test(content)) {
    failed = true;
    console.error(`Conflict marker found in ${file}`);
  }
}

if (failed) process.exit(1);
console.log('PASS: no unresolved conflict markers found');
