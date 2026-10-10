// Token-lean check runner (from the Shield vs Robots token tuning, 2026-10-10). Runs each
// step one after another, writes each one's full output to logs/<step>.log (gitignored by *.log),
// and prints only a PASS/FAIL line per step plus the failure lines. Agents run this
// instead of the raw scripts so a full test or build log never lands in their context;
// they open the log only for a failure they are fixing.
//
// A step is an npm script name, or "label=command" for anything else (Python, SQL, a CLI):
//
//   node scripts/quiet-check.mjs typecheck lint test               (npm scripts)
//   node scripts/quiet-check.mjs "lint=ruff check ." "test=python -m pytest -q"
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const LOG_DIR = 'logs';
const FAILURE_PATTERN = /\b(error|fail(ed|ure)?|FAIL)\b|✗|×|AssertionError|Expected|Received/i;
const PASS_SUMMARY_PATTERN = /^\s*(Tests?|Test Files)\s+\d+.*passed|^\s*\d+ passed|built in/i;

// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\u001b\[[0-9;]*[A-Za-z]/g;

export function stripAnsi(text) {
  return text.replace(ANSI_PATTERN, '');
}

/**
 * Turns one step's full output into the few lines an agent needs.
 * Pass: one line, with the test/build count when the tool printed one.
 * Fail: the matching failure lines (capped) and the last lines of output.
 */
export function summarize(step, exitCode, output, { maxFailureLines = 30, tailLines = 5 } = {}) {
  const lines = stripAnsi(output)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');
  const logPath = path.posix.join(LOG_DIR, `${logName(step)}.log`);

  if (exitCode === 0) {
    const counts = lines
      .filter((line) => PASS_SUMMARY_PATTERN.test(line))
      .map((line) => line.trim());
    const detail = counts.length > 0 ? ` - ${counts.join('; ')}` : '';
    return [`PASS ${step}${detail}`];
  }

  const failureLines = lines.filter((line) => FAILURE_PATTERN.test(line));
  const shown = failureLines.slice(0, maxFailureLines);
  const out = [`FAIL ${step} (exit ${exitCode}) - full log: ${logPath}`];
  out.push(...shown.map((line) => `  ${line}`));
  if (failureLines.length > shown.length) {
    out.push(`  ... ${failureLines.length - shown.length} more failure lines in the log`);
  }
  // Failure lines are already shown or counted above; the tail adds the tool's closing context.
  const tail = lines.slice(-tailLines).filter((line) => !FAILURE_PATTERN.test(line));
  if (tail.length > 0) {
    out.push('  last lines:');
    out.push(...tail.map((line) => `  ${line}`));
  }
  return out;
}

export function logName(step) {
  return step.replace(/[^A-Za-z0-9_-]+/g, '-');
}

/** "label=command" runs the command through the shell; anything else is an npm script. */
export function parseStep(step) {
  const match = /^([A-Za-z0-9:_-]+)=(.+)$/s.exec(step);
  if (match) return { label: match[1], command: match[2], npm: false };
  return { label: step, command: step, npm: true };
}

function runStep(step) {
  const { command, npm } = parseStep(step);
  return new Promise((resolve) => {
    const child = spawn(npm ? 'npm' : command, npm ? ['run', command, '--silent'] : [], {
      shell: npm ? process.platform === 'win32' : true,
      env: { ...process.env, CI: '1', FORCE_COLOR: '0', NO_COLOR: '1' },
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('error', (error) => resolve({ code: 1, output: `${output}\n${error.message}` }));
    child.on('close', (code) => resolve({ code: code ?? 1, output }));
  });
}

async function main() {
  const steps = process.argv.slice(2);
  if (steps.length === 0) {
    console.error('usage: node scripts/quiet-check.mjs <npm-script | label=command> ...');
    process.exitCode = 2;
    return;
  }
  mkdirSync(LOG_DIR, { recursive: true });
  let failed = 0;
  for (const step of steps) {
    const { label } = parseStep(step);
    const started = Date.now();
    const { code, output } = await runStep(step);
    writeFileSync(path.join(LOG_DIR, `${logName(label)}.log`), stripAnsi(output));
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    const [first, ...rest] = summarize(label, code, output);
    console.log(`${first} (${seconds}s)`);
    for (const line of rest) console.log(line);
    if (code !== 0) failed += 1;
  }
  console.log(
    failed === 0
      ? `quiet-check: all ${steps.length} passed`
      : `quiet-check: ${failed} of ${steps.length} failed`,
  );
  if (failed > 0) process.exitCode = 1;
}

// Guarded so summarize() can be unit-tested without running any npm scripts.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
