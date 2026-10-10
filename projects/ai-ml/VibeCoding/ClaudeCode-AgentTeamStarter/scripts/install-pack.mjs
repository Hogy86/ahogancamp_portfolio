// Installs an agent pack into .claude/ (agents, skills, team.json) and adds its quiet
// check scripts to package.json. Run by the project-setup skill after the owner approves
// the team.
//
//   npm run pack:list
//   npm run pack:install -- game                 (default modules: web)
//   npm run pack:install -- game --modules web,android
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installPack, loadPacks } from './packs-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function list() {
  for (const pack of Object.values(loadPacks(root))) {
    const modules = Object.entries(pack.modules ?? {})
      .map(([id, m]) => `${id}${m.default ? '*' : ''}`)
      .join(', ');
    console.log(`${pack.id} (${pack.status}, v${pack.version}) - ${pack.summary}`);
    console.log(`  modules: ${modules}   fits: ${(pack.fitsWhen ?? []).join('; ')}`);
  }
  console.log('* = installed by default');
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--list')) {
  list();
} else {
  const packId = args[0];
  const flag = args.indexOf('--modules');
  const modules = flag >= 0 ? (args[flag + 1] ?? '').split(',').filter(Boolean) : [];
  try {
    const { team, missing, addedScripts, rulesWritten } = installPack(root, packId, modules, {
      allowPlanned: args.includes('--allow-planned'),
    });
    console.log(`installed ${team.pack} ${team.packVersion}: modules ${team.modules.join(', ')}`);
    console.log(`  ${team.agents.length} agents in .claude/agents, ${team.skills.length} skills in .claude/skills`);
    for (const [mod, core] of Object.entries(team.core)) {
      console.log(`  core team (${mod}): ${core.builder}, ${core.reviewer}, ${core.tester}`);
    }
    if (rulesWritten) console.log('  wrote the pack rules into CLAUDE.md');
    if (addedScripts.length) console.log(`  added to package.json: ${addedScripts.join(', ')}`);
    if (missing.length) {
      console.log(`  MISSING skills (build them in the pack): ${missing.join(', ')}`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`pack:install failed: ${error.message}`);
    process.exitCode = 1;
  }
}
