import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(projectRoot, 'package.json');
const userscriptPath = path.join(projectRoot, 'anigamer_kits.user.js');

const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
const userscript = await readFile(userscriptPath, 'utf8');
const versionPattern = /^(\/\/\s+@version\s+).+$/m;

if (!versionPattern.test(userscript)) {
  throw new Error('Userscript @version metadata not found');
}

const updatedUserscript = userscript.replace(
  versionPattern,
  (_, prefix) => `${prefix}${packageJson.version}`
);

if (updatedUserscript !== userscript) {
  await writeFile(userscriptPath, updatedUserscript, 'utf8');
}

console.log(`Userscript version: ${packageJson.version}`);
