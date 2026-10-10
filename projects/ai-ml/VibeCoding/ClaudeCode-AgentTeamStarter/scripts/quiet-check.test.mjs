// Fixtures for the token-lean check runner (node:test, so the template needs no packages): a passing step collapses to one line, a
// failing step keeps its failure lines and points at the full log.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { logName, parseStep, stripAnsi, summarize } from './quiet-check.mjs';

describe('summarize', () => {
  it('collapses a passing vitest run to one line with its counts', () => {
    const output = [
      ' ✓ src/game/Score.test.ts (12 tests) 8ms',
      ' ✓ src/game/Shield.test.ts (30 tests) 20ms',
      '',
      ' Test Files  2 passed (2)',
      '      Tests  42 passed (42)',
      '   Duration  1.2s',
    ].join('\n');
    assert.deepEqual(summarize('test', 0, output), [
      'PASS test - Test Files  2 passed (2); Tests  42 passed (42)',
    ]);
  });

  it('keeps a pass to one line when the tool prints no counts', () => {
    assert.deepEqual(summarize('typecheck', 0, ''), ['PASS typecheck']);
  });

  it('keeps the failure lines and the log path for a failing step', () => {
    const output = [
      ' ✓ src/a.test.ts (3 tests)',
      ' FAIL src/b.test.ts > shield > bounces',
      'AssertionError: expected 3 to be 4',
      ' Test Files  1 failed | 1 passed (2)',
    ].join('\n');
    const lines = summarize('test', 1, output, { tailLines: 1 });
    assert.equal(lines[0], 'FAIL test (exit 1) - full log: logs/test.log');
    assert.ok(lines.includes('   FAIL src/b.test.ts > shield > bounces'));
    assert.ok(lines.includes('  AssertionError: expected 3 to be 4'));
    assert.equal(lines.some((line) => line.includes('src/a.test.ts')), false);
  });

  it('caps the failure lines and says how many more are in the log', () => {
    const output = Array.from({ length: 50 }, (_, i) => `error TS2322: problem ${i}`).join('\n');
    const lines = summarize('typecheck', 2, output, { maxFailureLines: 10 });
    assert.equal(lines.filter((line) => line.includes('error TS2322')).length, 10);
    assert.ok(lines.includes('  ... 40 more failure lines in the log'));
  });

  it('strips colour codes before matching', () => {
    assert.equal(stripAnsi('\u001b[31mFAIL\u001b[39m x'), 'FAIL x');
    const lint = summarize('lint', 1, '\u001b[31m  3:1  error  no-unused-vars\u001b[39m');
    assert.ok(lint.includes('    3:1  error  no-unused-vars'));
  });
});

describe('logName', () => {
  it('turns an npm script name into a safe file name', () => {
    assert.equal(logName('test:e2e:mobile'), 'test-e2e-mobile');
    assert.equal(logName('build:android'), 'build-android');
  });
});

describe('parseStep', () => {
  it('treats a bare name as an npm script and label=command as a shell command', () => {
    assert.deepEqual(parseStep('test:e2e'), { label: 'test:e2e', command: 'test:e2e', npm: true });
    assert.deepEqual(parseStep('test=python -m pytest -q'), { label: 'test', command: 'python -m pytest -q', npm: false });
  });
});
