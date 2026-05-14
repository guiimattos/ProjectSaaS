import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('rg --files --glob "!node_modules/**" --glob "!.next/**"', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

const markerRegex = /^(<<<<<<<\s+.+|=======|>>>>>>>\s+.+)$/m;
let failed = false;

for (const file of files) {
  // avoid false positive from this checker's own regex literal text
  if (file === 'scripts/validate-no-conflict-markers.mjs' || file === 'package.json') continue;
  const content = readFileSync(file, 'utf8');
  if (markerRegex.test(content)) {
    failed = true;
    console.error(`Conflict marker found in ${file}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log('PASS: no unresolved conflict markers found');
