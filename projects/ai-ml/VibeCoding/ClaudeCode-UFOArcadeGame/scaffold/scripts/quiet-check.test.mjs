// Fixtures for the token-lean check runner: a passing step collapses to one line, a
// failing step keeps its failure lines and points at the full log.
import { describe, expect, it } from 'vitest';
import { logName, stripAnsi, summarize } from './quiet-check.mjs';

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
    expect(summarize('test', 0, output)).toEqual([
      'PASS test - Test Files  2 passed (2); Tests  42 passed (42)',
    ]);
  });

  it('keeps a pass to one line when the tool prints no counts', () => {
    expect(summarize('typecheck', 0, '')).toEqual(['PASS typecheck']);
  });

  it('keeps the failure lines and the log path for a failing step', () => {
    const output = [
      ' ✓ src/a.test.ts (3 tests)',
      ' FAIL src/b.test.ts > shield > bounces',
      'AssertionError: expected 3 to be 4',
      ' Test Files  1 failed | 1 passed (2)',
    ].join('\n');
    const lines = summarize('test', 1, output, { tailLines: 1 });
    expect(lines[0]).toBe('FAIL test (exit 1) - full log: logs/test.log');
    expect(lines).toContain('   FAIL src/b.test.ts > shield > bounces');
    expect(lines).toContain('  AssertionError: expected 3 to be 4');
    expect(lines.some((line) => line.includes('src/a.test.ts'))).toBe(false);
  });

  it('caps the failure lines and says how many more are in the log', () => {
    const output = Array.from({ length: 50 }, (_, i) => `error TS2322: problem ${i}`).join('\n');
    const lines = summarize('typecheck', 2, output, { maxFailureLines: 10 });
    expect(lines.filter((line) => line.includes('error TS2322'))).toHaveLength(10);
    expect(lines).toContain('  ... 40 more failure lines in the log');
  });

  it('strips colour codes before matching', () => {
    expect(stripAnsi('\u001b[31mFAIL\u001b[39m x')).toBe('FAIL x');
    expect(summarize('lint', 1, '\u001b[31m  3:1  error  no-unused-vars\u001b[39m')).toContain(
      '    3:1  error  no-unused-vars',
    );
  });
});

describe('logName', () => {
  it('turns an npm script name into a safe file name', () => {
    expect(logName('test:e2e:mobile')).toBe('test-e2e-mobile');
    expect(logName('build:android')).toBe('build-android');
  });
});
