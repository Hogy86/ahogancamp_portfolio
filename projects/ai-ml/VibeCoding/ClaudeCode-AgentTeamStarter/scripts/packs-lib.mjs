// Shared helpers for the agent packs: reading manifests, resolving borrowed agents and
// skills, installing a pack into .claude/, and checking that every agent keeps the
// token-tuning rules. Used by install-pack.mjs and check-agents.mjs.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const MODELS = ['opus', 'sonnet', 'haiku'];
export const MAX_AGENT_BYTES = 6144;
export const BASE_SKILLS = ['lean-runs', 'project-setup', 'traceability-conventions'];
const OVERLAY_HEADING = '## Changes for this project type';

export function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** All packs under <root>/packs, keyed by id. Folders starting with _ are not packs. */
export function loadPacks(root) {
  const dir = path.join(root, 'packs');
  const packs = {};
  for (const entry of readdirSync(dir)) {
    const manifest = path.join(dir, entry, 'pack.json');
    if (entry.startsWith('_') || !existsSync(manifest)) continue;
    const pack = readJson(manifest);
    pack.dir = path.join(dir, entry);
    packs[pack.id] = pack;
  }
  return packs;
}

/** Splits an agent or skill file into its frontmatter fields and body. */
export function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { fields: {}, body: text, raw: '' };
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_-]+):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return { fields, body: text.slice(match[0].length), raw: match[1] };
}

export function listField(value) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function setField(raw, key, value) {
  const line = `${key}: ${value}`;
  const pattern = new RegExp(`^${key}:.*$`, 'm');
  return pattern.test(raw) ? raw.replace(pattern, line) : `${raw}\n${line}`;
}

/**
 * Returns the final text of one agent in a pack: its own file, or a borrowed agent with
 * the pack's changes applied (extra skills, model, description, rename, overlay).
 */
export function resolveAgent(packs, packId, name, seen = new Set()) {
  const pack = packs[packId];
  if (!pack) throw new Error(`unknown pack "${packId}"`);
  const key = `${packId}/${name}`;
  if (seen.has(key)) throw new Error(`borrowing loop at ${key}`);
  seen.add(key);

  const own = path.join(pack.dir, 'agents', `${name}.md`);
  if (existsSync(own)) return { text: readFileSync(own, 'utf8'), origin: key };

  const entry = pack.agents?.[name];
  if (!entry?.from) {
    throw new Error(`${key}: no agent file and no "from" to borrow it from`);
  }
  const borrowed = resolveAgent(packs, entry.from, entry.source ?? name, seen);
  const { raw, body } = parseFrontmatter(borrowed.text);
  let fm = raw;
  fm = setField(fm, 'name', entry.as ?? name);
  if (entry.description) fm = setField(fm, 'description', entry.description);
  if (entry.model) fm = setField(fm, 'model', entry.model);
  if (entry.addSkills?.length) {
    const skills = listField(parseFrontmatter(borrowed.text).fields.skills);
    for (const skill of entry.addSkills) if (!skills.includes(skill)) skills.push(skill);
    fm = setField(fm, 'skills', skills.join(', '));
  }
  let text = `---\n${fm}\n---\n${body}`;
  if (entry.overlay) {
    const overlay = readFileSync(path.join(pack.dir, entry.overlay), 'utf8').trim();
    text = `${text.trimEnd()}\n\n${OVERLAY_HEADING}\n\n${overlay}\n`;
  }
  return { text, origin: `${key} (borrowed from ${borrowed.origin})` };
}

/** Finds a skill folder: this pack, the base skills, the packs agents came from, any pack. */
export function resolveSkill(root, packs, packId, skill, borrowedFrom = []) {
  const candidates = [
    path.join(packs[packId].dir, 'skills', skill),
    path.join(root, '.claude', 'skills', skill),
    ...borrowedFrom.map((id) => path.join(packs[id].dir, 'skills', skill)),
    ...Object.values(packs).map((p) => path.join(p.dir, 'skills', skill)),
  ];
  return candidates.find((dir) => existsSync(path.join(dir, 'SKILL.md'))) ?? null;
}

/** Which modules to install: the ones asked for (or the defaults) plus what they require. */
export function selectModules(pack, requested) {
  const all = Object.keys(pack.modules ?? {});
  const chosen = requested?.length
    ? requested
    : all.filter((id) => pack.modules[id].default);
  const result = [];
  const add = (id) => {
    if (!pack.modules[id]) throw new Error(`pack "${pack.id}" has no module "${id}" (has: ${all.join(', ')})`);
    for (const dep of pack.modules[id].requires ?? []) add(dep);
    if (!result.includes(id)) result.push(id);
  };
  chosen.forEach(add);
  return result;
}

/** Agent names a module set needs: the full team plus the core team. */
export function teamFor(pack, modules) {
  const names = [];
  for (const id of modules) {
    const mod = pack.modules[id];
    for (const name of [...(mod.fullTeam ?? []), ...Object.values(mod.core ?? {})]) {
      if (!names.includes(name)) names.push(name);
    }
  }
  return names;
}

/**
 * Copies a pack's agents and skills into <root>/.claude and records the choice in
 * .claude/team.json. Agents installed by an earlier run of another pack are removed.
 */
export function installPack(root, packId, requestedModules, { allowPlanned = false, now = new Date() } = {}) {
  const packs = loadPacks(root);
  const pack = packs[packId];
  if (!pack) throw new Error(`unknown pack "${packId}" (have: ${Object.keys(packs).join(', ')})`);
  if (pack.status !== 'ready' && !allowPlanned) {
    throw new Error(`pack "${packId}" is ${pack.status}: build its missing agents and skills first (project-setup skill)`);
  }
  const modules = selectModules(pack, requestedModules);
  const agentsDir = path.join(root, '.claude', 'agents');
  const skillsDir = path.join(root, '.claude', 'skills');
  const teamFile = path.join(root, '.claude', 'team.json');

  const previous = existsSync(teamFile) ? readJson(teamFile) : null;
  for (const agent of previous?.agents ?? []) rmSync(path.join(agentsDir, `${agent.name}.md`), { force: true });
  for (const skill of previous?.skills ?? []) {
    if (!BASE_SKILLS.includes(skill)) rmSync(path.join(skillsDir, skill), { recursive: true, force: true });
  }
  mkdirSync(agentsDir, { recursive: true });

  const agents = [];
  const skillNames = new Set();
  const borrowedFrom = new Set();
  for (const name of teamFor(pack, modules)) {
    const { text, origin } = resolveAgent(packs, packId, name);
    const entry = pack.agents?.[name] ?? {};
    if (entry.from) borrowedFrom.add(entry.from);
    const installedName = entry.as ?? name;
    writeFileSync(path.join(agentsDir, `${installedName}.md`), text);
    agents.push({ name: installedName, origin });
    for (const skill of listField(parseFrontmatter(text).fields.skills)) skillNames.add(skill);
  }
  for (const id of modules) if (pack.modules[id].pipelineSkill) skillNames.add(pack.modules[id].pipelineSkill);

  const skills = [];
  const missing = [];
  for (const skill of skillNames) {
    if (BASE_SKILLS.includes(skill)) continue;
    const src = resolveSkill(root, packs, packId, skill, [...borrowedFrom]);
    if (!src) {
      missing.push(skill);
      continue;
    }
    cpSync(src, path.join(skillsDir, skill), { recursive: true });
    skills.push(skill);
  }

  const checks = {};
  const core = {};
  for (const id of modules) {
    Object.assign(checks, pack.modules[id].checks ?? {});
    core[id] = pack.modules[id].core;
  }
  const team = {
    pack: pack.id,
    packVersion: pack.version,
    modules,
    core,
    checks,
    installedAt: now.toISOString(),
    agents,
    skills,
  };
  writeFileSync(teamFile, `${JSON.stringify(team, null, 2)}\n`);

  const rulesWritten = writePackRules(root, pack);

  const pkgFile = path.join(root, 'package.json');
  const addedScripts = [];
  if (existsSync(pkgFile)) {
    const pkg = readJson(pkgFile);
    pkg.scripts ??= {};
    for (const [script, command] of Object.entries(checks)) {
      if (!pkg.scripts[script]) {
        pkg.scripts[script] = command;
        addedScripts.push(script);
      }
    }
    if (addedScripts.length) writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
  }
  return { team, missing, addedScripts, rulesWritten };
}

const RULES_START = /<!-- pack-rules:start.*?-->/;
const RULES_END = '<!-- pack-rules:end -->';

/** Replaces the pack-rules block in CLAUDE.md with the pack's claude-rules file (or empties it). */
export function writePackRules(root, pack) {
  const file = path.join(root, 'CLAUDE.md');
  if (!existsSync(file)) return false;
  const text = readFileSync(file, 'utf8');
  const start = RULES_START.exec(text);
  const end = text.indexOf(RULES_END);
  if (!start || end < start.index) return false;
  const rules = pack.claudeRules ? readFileSync(path.join(pack.dir, pack.claudeRules), 'utf8').trim() : '';
  const block = rules ? `\n${rules}\n` : '\n';
  const updated = text.slice(0, start.index + start[0].length) + block + text.slice(end);
  writeFileSync(file, updated);
  return true;
}

function agentFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.join(dir, file));
}

/** Checks one agent's text against the rules every agent must keep. */
export function checkAgentText(label, text, { expectedName, readOnly = false, role } = {}) {
  const errors = [];
  const { fields } = parseFrontmatter(text);
  const bytes = Buffer.byteLength(text, 'utf8');
  if (!fields.name) errors.push(`${label}: no name: line`);
  else if (expectedName && fields.name !== expectedName) {
    errors.push(`${label}: name "${fields.name}" does not match the file name "${expectedName}"`);
  }
  if (!fields.description) errors.push(`${label}: no description: line`);
  if (!fields.tools) errors.push(`${label}: no tools: line`);
  if (!MODELS.includes(fields.model)) {
    errors.push(`${label}: model must be one of ${MODELS.join(', ')} (got "${fields.model ?? ''}")`);
  }
  if (!listField(fields.skills).includes('lean-runs')) errors.push(`${label}: skills must include lean-runs`);
  if (bytes > MAX_AGENT_BYTES) errors.push(`${label}: ${bytes} bytes, over the ${MAX_AGENT_BYTES}-byte limit`);
  const tools = listField(fields.tools);
  if (readOnly && tools.some((tool) => tool === 'Edit' || tool === 'Write')) {
    errors.push(`${label}: read-only reviewer must not have Edit or Write (has: ${tools.join(', ')})`);
  }
  if (role === 'reviewer' && fields.model === 'haiku') errors.push(`${label}: a reviewer is never on haiku`);
  return errors;
}

/** Runs every check. Returns { errors, notes }; any error fails the check. */
export function checkAll(root) {
  const errors = [];
  const notes = [];
  for (const skill of BASE_SKILLS) {
    if (!existsSync(path.join(root, '.claude', 'skills', skill, 'SKILL.md'))) {
      errors.push(`.claude/skills/${skill}/SKILL.md is missing (base skill)`);
    }
  }

  const template = path.join(root, 'packs', '_agent-template.md');
  if (existsSync(template)) errors.push(...checkAgentText('packs/_agent-template.md', readFileSync(template, 'utf8')));

  const packs = loadPacks(root);
  for (const pack of Object.values(packs)) {
    const rel = (file) => path.relative(root, file).split(path.sep).join('/');
    for (const file of agentFiles(path.join(pack.dir, 'agents'))) {
      const name = path.basename(file, '.md');
      const entry = pack.agents?.[name] ?? {};
      if (!pack.agents?.[name]) errors.push(`${rel(file)}: not listed in ${pack.id}/pack.json "agents"`);
      errors.push(...checkAgentText(rel(file), readFileSync(file, 'utf8'), { expectedName: name, ...entry }));
    }
    for (const [id, mod] of Object.entries(pack.modules ?? {})) {
      for (const role of ['builder', 'reviewer', 'tester']) {
        if (!mod.core?.[role]) errors.push(`${pack.id}/pack.json: module "${id}" has no core ${role}`);
      }
    }
    if (pack.status !== 'ready') {
      const toBuild = Object.entries(pack.agents ?? {}).filter(([, e]) => e.build).length;
      notes.push(`${pack.id}: ${pack.status} (${toBuild} agents and ${Object.keys(pack.skillsToBuild ?? {}).length} skills still to build)`);
      continue;
    }
    if (pack.claudeRules && !existsSync(path.join(pack.dir, pack.claudeRules))) {
      errors.push(`${pack.id}/pack.json: claudeRules file "${pack.claudeRules}" not found`);
    }
    // A ready pack must install cleanly: every agent resolves, keeps the rules, and every skill exists.
    for (const id of Object.keys(pack.modules ?? {})) {
      for (const name of teamFor(pack, [id])) {
        const entry = pack.agents?.[name];
        if (!entry) {
          errors.push(`${pack.id}/pack.json: module "${id}" names "${name}", which is not in "agents"`);
          continue;
        }
        let resolved;
        try {
          resolved = resolveAgent(packs, pack.id, name);
        } catch (error) {
          errors.push(`${pack.id}: ${error.message}`);
          continue;
        }
        if (entry.from) {
          errors.push(...checkAgentText(`${pack.id}/${name} (borrowed)`, resolved.text, { expectedName: entry.as ?? name, ...entry }));
        }
        const borrowedFrom = entry.from ? [entry.from] : [];
        for (const skill of listField(parseFrontmatter(resolved.text).fields.skills)) {
          if (!resolveSkill(root, packs, pack.id, skill, borrowedFrom)) {
            errors.push(`${pack.id}/${name}: skill "${skill}" not found in any pack or .claude/skills`);
          }
        }
      }
      const pipeline = pack.modules[id].pipelineSkill;
      if (pipeline && !resolveSkill(root, packs, pack.id, pipeline)) {
        errors.push(`${pack.id}/pack.json: module "${id}" pipeline skill "${pipeline}" not found`);
      }
    }
  }

  // The installed team (after project setup) is checked against the same rules.
  const teamFile = path.join(root, '.claude', 'team.json');
  const installedDir = path.join(root, '.claude', 'agents');
  const team = existsSync(teamFile) ? readJson(teamFile) : null;
  const installedPack = team ? packs[team.pack] : null;
  for (const file of agentFiles(installedDir)) {
    const name = path.basename(file, '.md');
    const entry = installedPack?.agents?.[name] ?? Object.values(installedPack?.agents ?? {}).find((e) => e.as === name) ?? {};
    errors.push(...checkAgentText(`.claude/agents/${name}.md`, readFileSync(file, 'utf8'), { expectedName: name, ...entry }));
  }
  if (team) {
    for (const agent of team.agents ?? []) {
      if (!existsSync(path.join(installedDir, `${agent.name}.md`))) {
        errors.push(`.claude/team.json lists ${agent.name}, but .claude/agents/${agent.name}.md is missing`);
      }
    }
    notes.push(`installed: ${team.pack} ${team.packVersion} (${team.modules.join(', ')}), ${team.agents.length} agents`);
  } else if (agentFiles(installedDir).length === 0) {
    notes.push('no team installed yet: run the project-setup skill');
  }
  return { errors, notes };
}
