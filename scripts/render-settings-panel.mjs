// Render the settings panel from the built userscript into img/setting_panel.png.
// Runs after every build; it only re-renders when the bundle changed and only
// rewrites the PNG when the pixels differ, so unrelated builds leave git clean.
// Needs a local Chrome/Chromium (CHROME_PATH overrides the lookup); skipped in CI.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleFile = path.join(projectRoot, 'dist', 'anigamer_kits.user.js');
const outputFile = path.join(projectRoot, 'img', 'setting_panel.png');
const cacheFile = path.join(projectRoot, '.cache', 'setting_panel.sha256');

// The panel inherits these from ani.gamer.com.tw (dark theme); mirror them so the
// image looks like the panel on the real site
const PAGE_BACKGROUND = '#111';
const SITE_BASE_CSS = `
  body {
    font-family: "Helvetica Neue", Helvetica, Arial, "Noto Sans TC", PingFangTC-Light,
      STHeitiTC-Light, "Microsoft JhengHei", sans-serif;
    line-height: 1;
  }
  h3 { margin: 0; line-height: 30px; }
  input { background-color: rgb(59, 59, 59); color: #fff; font-family: inherit; }
`;
const DEVICE_SCALE_FACTOR = 2;
// Room left of / above the panel; the panel itself sits 20px from the right edge
const PAGE_PADDING = 20;
const RENDER_TIME_BUDGET_MS = 3000;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

const log = (message) => console.log(`[settings panel] ${message}`);

if (process.env.CI) {
  log('skipped in CI');
  process.exit(0);
}

const chrome = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
if (!chrome) {
  log('skipped: Chrome not found (set CHROME_PATH to enable)');
  process.exit(0);
}

const [bundle, renderScript] = await Promise.all([
  readFile(bundleFile, 'utf8'),
  readFile(fileURLToPath(import.meta.url), 'utf8')
]);
const inputHash = createHash('sha256').update(bundle).update(renderScript).digest('hex');
const cachedHash = await readFile(cacheFile, 'utf8').catch(() => '');
if (cachedHash.trim() === inputHash && existsSync(outputFile)) {
  log('unchanged');
  process.exit(0);
}

/**
 * A blank page that runs the real bundle with GM storage returning the defaults
 * (so no personal values such as the phone barcode end up in the image) and opens the panel.
 **/
const harnessHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; background: ${PAGE_BACKGROUND}; }
  ${SITE_BASE_CSS}
  /* Show every option instead of the scrollable 50vh panel, and skip the fade-in */
  .anigamerkit-settings-panel { max-height: none !important; transition: none !important; }
  #settingBtn { transition: none !important; }
</style>
<script>
  window.GM_getValue = (key, fallback) => fallback;
  window.GM_setValue = () => {};
  window.GM_xmlhttpRequest = () => {};
</script>
<script src="${pathToFileURL(bundleFile).href}"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      document.querySelector('#settingBtn').click();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const rect = document.querySelector('.anigamerkit-settings-panel').getBoundingClientRect();
        const marker = document.createElement('meta');
        marker.name = 'panel-size';
        // Panel plus the space below it down to the viewport edge, where the + button sits
        marker.content = [
          Math.ceil(rect.width + ${PAGE_PADDING} * 2),
          Math.ceil(rect.height + (innerHeight - rect.bottom) + ${PAGE_PADDING})
        ].join('x');
        document.head.appendChild(marker);
      }));
    });
  });
</script>
</head>
<body></body>
</html>
`;

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'anigamerkit-panel-'));
try {
  const harnessFile = path.join(tempDir, 'panel.html');
  const screenshotFile = path.join(tempDir, 'panel.png');
  await writeFile(harnessFile, harnessHtml, 'utf8');

  const chromeArgs = (windowSize) => [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    `--user-data-dir=${path.join(tempDir, 'profile')}`,
    `--force-device-scale-factor=${DEVICE_SCALE_FACTOR}`,
    `--virtual-time-budget=${RENDER_TIME_BUDGET_MS}`,
    `--window-size=${windowSize}`
  ];
  const harnessUrl = pathToFileURL(harnessFile).href;

  // Pass 1: lay out in a tall window to measure the panel
  const { stdout } = await run(chrome, [...chromeArgs('800,1200'), '--dump-dom', harnessUrl], {
    maxBuffer: 16 * 1024 * 1024
  });
  const size = stdout.match(/name="panel-size" content="(\d+)x(\d+)"/);
  if (!size) {
    throw new Error('settings panel did not render');
  }
  const windowSize = `${size[1]},${size[2]}`;

  // Pass 2: screenshot with the window cropped to the panel
  await run(chrome, [...chromeArgs(windowSize), `--screenshot=${screenshotFile}`, harnessUrl]);
  const rendered = await readFile(screenshotFile);
  const existing = await readFile(outputFile).catch(() => null);

  if (existing && existing.equals(rendered)) {
    log('rendered image is identical');
  } else {
    await writeFile(outputFile, rendered);
    log(`updated ${path.relative(projectRoot, outputFile)} (${windowSize} @${DEVICE_SCALE_FACTOR}x)`);
  }

  await mkdir(path.dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, `${inputHash}\n`, 'utf8');
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
