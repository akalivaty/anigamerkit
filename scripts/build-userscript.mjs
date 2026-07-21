import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entryFile = 'anigamer_kits.user.js';
const sourceFiles = ['danmuku.js', 'user_settings.js', 'utils.js'];
const outputFile = path.join(projectRoot, 'dist', entryFile);

const readSource = (file) => readFile(path.join(projectRoot, file), 'utf8');
const stripUseStrict = (source) => source.replace(/^\s*['"]use strict['"];?\s*/, '');

const entrySource = await readSource(entryFile);
const packageJson = JSON.parse(await readSource('package.json'));
const metadataMatch = entrySource.match(/^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==/m);

if (!metadataMatch) {
  throw new Error(`Userscript metadata block not found in ${entryFile}`);
}

const userscriptVersion = metadataMatch[0].match(/^\/\/\s+@version\s+(.+)$/m)?.[1];
if (userscriptVersion !== packageJson.version) {
  throw new Error(`Version mismatch: package.json=${packageJson.version}, userscript=${userscriptVersion}`);
}

if (/^\/\/\s+@require\s+/m.test(metadataMatch[0])) {
  throw new Error('Source metadata must not contain @require directives');
}

const metadata = metadataMatch[0];
const entryBody = entrySource.replace(metadataMatch[0], '').trim();
const sources = await Promise.all(sourceFiles.map(readSource));
const bundledSources = sources.map(stripUseStrict).map((source) => source.trim());

const output = `${metadata}

(function () {
    'use strict';

${[...bundledSources, entryBody].join('\n\n')}
})();
`;

if (output.includes('@require')) {
  throw new Error('Bundled userscript must not contain @require directives');
}

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, output, 'utf8');

console.log(`Built ${path.relative(projectRoot, outputFile)}`);
