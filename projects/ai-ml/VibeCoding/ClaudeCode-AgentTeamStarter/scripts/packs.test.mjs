import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkAgentText, checkAll, installPack, loadPacks, parseFrontmatter, resolveAgent, selectModules } from './packs-lib.mjs';

const templateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempDirs = [];

/** A throwaway copy of the template, so installs and broken fixtures never touch the real one. */
function copyTemplate() {
  const dir = mkdtempSync(path.join(tmpdir(), 'agent-starter-'));
  tempDirs.push(dir);
  for (const part of ['CLAUDE.md', 'package.json', '.claude', 'packs', 'scripts']) {
    cpSync(path.join(templateRoot, part), path.join(dir, part), { recursive: true });
  }
  return dir;
}

after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

const goodAgent = (overrides = {}) => {
  const f = { name: 'x', description: 'Does x.', tools: 'Read, Grep', model: 'sonnet', skills: 'lean-runs', ...overrides };
  const lines = Object.entries(f).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---\n\nBody.\n`;
};

describe('the template itself', () => {
  it('passes agents:check', () => {
    const { errors } = checkAll(templateRoot);
    assert.deepEqual(errors, []);
  });

  it('marks every game agent as a game-pack agent', () => {
    const game = loadPacks(templateRoot).game;
    assert.equal(game.status, 'ready');
    for (const mod of Object.values(game.modules)) {
      for (const name of [...mod.fullTeam, ...Object.values(mod.core)]) assert.ok(game.agents[name], name);
    }
  });
});

describe('checkAgentText', () => {
  it('accepts an agent that keeps the rules', () => {
    assert.deepEqual(checkAgentText('x', goodAgent(), { expectedName: 'x' }), []);
  });

  it('rejects a missing model, missing lean-runs, a writing reviewer and a haiku reviewer', () => {
    assert.match(checkAgentText('x', goodAgent({ model: undefined })).join(), /model must be/);
    assert.match(checkAgentText('x', goodAgent({ skills: 'coding-standards' })).join(), /lean-runs/);
    assert.match(checkAgentText('x', goodAgent({ tools: 'Read, Edit' }), { readOnly: true }).join(), /read-only/);
    assert.match(checkAgentText('x', goodAgent({ model: 'haiku' }), { role: 'reviewer' }).join(), /never on haiku/);
  });

  it('rejects an agent over the size limit', () => {
    const big = goodAgent() + 'a'.repeat(7000);
    assert.match(checkAgentText('x', big).join(), /over the/);
  });
});

describe('selectModules', () => {
  it('uses the defaults and pulls in required modules', () => {
    const game = loadPacks(templateRoot).game;
    assert.deepEqual(selectModules(game, []), ['web']);
    assert.deepEqual(selectModules(game, ['android']), ['web', 'android']);
    assert.throws(() => selectModules(game, ['ios']), /no module "ios"/);
  });
});

describe('installPack', () => {
  it('installs the game pack: agents, skills, team.json, package.json scripts, CLAUDE.md rules', () => {
    const root = copyTemplate();
    const { team, missing, addedScripts } = installPack(root, 'game', ['android']);
    assert.deepEqual(missing, []);
    assert.deepEqual(team.modules, ['web', 'android']);
    assert.equal(team.core.android.reviewer, 'mobile-lead-developer');
    assert.ok(existsSync(path.join(root, '.claude/agents/mobile-lead-tester.md')));
    assert.ok(existsSync(path.join(root, '.claude/skills/mobile-full-pipeline/SKILL.md')));
    assert.ok(addedScripts.includes('e2e:quiet'));
    assert.match(readFileSync(path.join(root, 'CLAUDE.md'), 'utf8'), /### Game pack rules/);
    assert.deepEqual(checkAll(root).errors, []);
  });

  it('refuses a planned pack', () => {
    const root = copyTemplate();
    assert.throws(() => installPack(root, 'data-science', []), /planned/);
  });

  it('borrows an agent with extra skills, a model change, a new name and an overlay', () => {
    const root = copyTemplate();
    const dir = path.join(root, 'packs', 'demo');
    mkdirSync(path.join(dir, 'overlays'), { recursive: true });
    mkdirSync(path.join(dir, 'skills', 'demo-checklist'), { recursive: true });
    writeFileSync(path.join(dir, 'skills', 'demo-checklist', 'SKILL.md'), '---\nname: demo-checklist\ndescription: d\n---\n');
    writeFileSync(path.join(dir, 'overlays', 'reviewer.md'), 'Also check the demo rules.');
    writeFileSync(
      path.join(dir, 'pack.json'),
      JSON.stringify({
        id: 'demo',
        name: 'Demo',
        version: '1.0.0',
        status: 'ready',
        summary: 'demo',
        modules: {
          main: {
            default: true,
            core: { builder: 'code-implementer', reviewer: 'demo-reviewer', tester: 'test-validator' },
            fullTeam: [],
          },
        },
        agents: {
          'code-implementer': { from: 'game', role: 'builder' },
          'demo-reviewer': {
            from: 'game',
            source: 'code-reviewer',
            role: 'reviewer',
            readOnly: true,
            addSkills: ['demo-checklist'],
            overlay: 'overlays/reviewer.md',
          },
          'test-validator': { from: 'game', role: 'tester', model: 'opus' },
        },
      }),
    );
    const packs = loadPacks(root);
    const reviewer = resolveAgent(packs, 'demo', 'demo-reviewer');
    const { fields, body } = parseFrontmatter(reviewer.text);
    assert.equal(fields.name, 'demo-reviewer');
    assert.match(fields.skills, /^lean-runs, .*demo-checklist$/);
    assert.match(body, /## Changes for this project type\n\nAlso check the demo rules\./);
    assert.equal(parseFrontmatter(resolveAgent(packs, 'demo', 'test-validator').text).fields.model, 'opus');

    const { missing } = installPack(root, 'demo', []);
    assert.deepEqual(missing, []);
    assert.ok(existsSync(path.join(root, '.claude/skills/coding-standards/SKILL.md')), 'skill found in the lending pack');
    assert.ok(existsSync(path.join(root, '.claude/skills/demo-checklist/SKILL.md')));
    assert.deepEqual(checkAll(root).errors, []);
  });

  it('removes the previous pack\'s agents on reinstall', () => {
    const root = copyTemplate();
    installPack(root, 'game', ['android']);
    installPack(root, 'game', ['web']);
    assert.ok(!existsSync(path.join(root, '.claude/agents/mobile-lead-tester.md')));
    assert.ok(existsSync(path.join(root, '.claude/agents/code-reviewer.md')));
    assert.ok(existsSync(path.join(root, '.claude/skills/lean-runs/SKILL.md')), 'base skills stay');
  });

  it('fails the check when an installed agent drops lean-runs', () => {
    const root = copyTemplate();
    installPack(root, 'game', []);
    const file = path.join(root, '.claude/agents/code-reviewer.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace('lean-runs, ', ''));
    assert.match(checkAll(root).errors.join('\n'), /code-reviewer\.md: skills must include lean-runs/);
  });
});
