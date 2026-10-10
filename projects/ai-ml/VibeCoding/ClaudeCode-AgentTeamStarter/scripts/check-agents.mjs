// Fails when any agent file loses the token-tuning rules: a model on every agent,
// lean-runs loaded, reviewers read-only and never on haiku, files under the size limit,
// and every pack able to install cleanly. Runs on every PR (.github/workflows).
//
//   npm run agents:check
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAll } from './packs-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { errors, notes } = checkAll(root);
for (const note of notes) console.log(`note: ${note}`);
if (errors.length) {
  for (const error of errors) console.log(`FAIL ${error}`);
  console.log(`agents:check: ${errors.length} problem(s)`);
  process.exitCode = 1;
} else {
  console.log('agents:check: PASS');
}
