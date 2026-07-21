import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

class TestEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = Boolean(options.bubbles);
  }
}

async function loadFunctions(file, names, context = {}) {
  const source = await readFile(path.join(projectRoot, file), 'utf8');
  const sandbox = {
    console: { log() {}, error() {} },
    Event: TestEvent,
    URL,
    ...context
  };

  vm.runInNewContext(
    `${source}\nglobalThis.__test = { ${names.join(', ')} };`,
    sandbox,
    { filename: file }
  );

  return sandbox.__test;
}

test('URL routing uses pathname and search parameters', async () => {
  const { getPageType } = await loadFunctions('utils.js', ['getPageType']);
  const cases = [
    ['https://ani.gamer.com.tw/', 'home'],
    ['https://ani.gamer.com.tw/?from=test', 'home'],
    ['https://ani.gamer.com.tw/animeVideo.php?foo=bar&sn=123', 'video'],
    ['https://ani.gamer.com.tw/party.php?sn=123', 'video'],
    ['https://ani.gamer.com.tw/animePay2.php?other=1&itemSn=456', 'payment'],
    ['https://ani.gamer.com.tw/animeVideo.php?sn=invalid', 'unknown']
  ];

  for (const [url, expected] of cases) {
    assert.equal(getPageType(new URL(url)), expected);
  }
});

test('modifySpeed safely ignores shortcuts when video is absent', async () => {
  const document = { querySelector: () => null };
  const { modifySpeed } = await loadFunctions('utils.js', ['modifySpeed'], { document });

  assert.doesNotThrow(() => modifySpeed({ shiftKey: true, key: '>' }));
});

test('sendDanmuku reports failure without required DOM elements', async () => {
  const document = { querySelector: () => null };
  const { sendDanmuku } = await loadFunctions('danmuku.js', ['sendDanmuku'], { document });

  assert.equal(sendDanmuku('hello', false), false);
});

test('sendDanmuku sends content when required DOM elements exist', async () => {
  const danmuInput = { value: '' };
  let clickCount = 0;
  const document = {
    querySelector(selector) {
      if (selector === '#danmutxt') return danmuInput;
      if (selector === '.danmu-send_btn') return { click: () => { clickCount += 1; } };
      return null;
    }
  };
  const { sendDanmuku } = await loadFunctions('danmuku.js', ['sendDanmuku'], { document });

  assert.equal(sendDanmuku('hello', false), true);
  assert.equal(danmuInput.value, 'hello');
  assert.equal(clickCount, 1);
});

test('payment checkboxes emit a bubbling change event', async () => {
  const events = [];
  const checkbox = {
    checked: false,
    dispatchEvent(event) {
      events.push(event);
    }
  };
  const document = {
    querySelector: () => null,
    querySelectorAll: () => [checkbox]
  };
  const { autoInputPaymentInfo } = await loadFunctions(
    'utils.js',
    ['autoInputPaymentInfo'],
    { document }
  );

  autoInputPaymentInfo();

  assert.equal(checkbox.checked, true);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'change');
  assert.equal(events[0].bubbles, true);
});

test('floating video visibility uses height instead of area', async () => {
  const { getVisibleHeightRatio } = await loadFunctions(
    'floating_video.js',
    ['getVisibleHeightRatio']
  );

  assert.equal(getVisibleHeightRatio({
    intersectionRect: { height: 40 },
    boundingClientRect: { height: 100 }
  }), 0.4);
  assert.equal(getVisibleHeightRatio({
    intersectionRect: { height: 120 },
    boundingClientRect: { height: 100 }
  }), 1);
  assert.equal(getVisibleHeightRatio({
    intersectionRect: { height: 0 },
    boundingClientRect: { height: 0 }
  }), 0);
});

test('floating video uses 50/60 percent hysteresis', async () => {
  const { shouldFloatVideo } = await loadFunctions(
    'floating_video.js',
    ['shouldFloatVideo']
  );

  assert.equal(shouldFloatVideo(false, 0.49, true, false), true);
  assert.equal(shouldFloatVideo(false, 0.5, true, false), false);
  assert.equal(shouldFloatVideo(true, 0.59, true, false), true);
  assert.equal(shouldFloatVideo(true, 0.6, true, false), false);
  assert.equal(shouldFloatVideo(false, 0.2, false, false), false);
  assert.equal(shouldFloatVideo(true, 0.2, false, false), true);
  assert.equal(shouldFloatVideo(true, 0.2, true, true), false);
});

test('floating video dragging stays inside the viewport', async () => {
  const { getDraggedFloatingRect } = await loadFunctions(
    'floating_video.js',
    ['getDraggedFloatingRect']
  );
  const startRect = { left: 100, top: 80, width: 400, height: 225 };

  assert.deepEqual(
    { ...getDraggedFloatingRect(startRect, 1000, 1000, 1000, 700) },
    { left: 600, top: 475, width: 400, height: 225 }
  );
  assert.deepEqual(
    { ...getDraggedFloatingRect(startRect, -1000, -1000, 1000, 700) },
    { left: 0, top: 0, width: 400, height: 225 }
  );
});

test('floating video reuses remembered size only within the page lifecycle', async () => {
  const { getInitialFloatingSize } = await loadFunctions(
    'floating_video.js',
    ['getInitialFloatingSize']
  );

  assert.deepEqual(
    { ...getInitialFloatingSize(null, 16 / 9, 1000, 800) },
    { width: 420, height: 236.25 }
  );
  assert.deepEqual(
    { ...getInitialFloatingSize({ width: 560, height: 315 }, 16 / 9, 1000, 800) },
    { width: 560, height: 315 }
  );
  assert.deepEqual(
    { ...getInitialFloatingSize({ width: 560, height: 315 }, 16 / 9, 300, 200) },
    { width: 268, height: 112 }
  );
});

test('floating video can resize from all four corners', async () => {
  const { getResizedFloatingRect } = await loadFunctions(
    'floating_video.js',
    ['getResizedFloatingRect']
  );
  const startRect = { left: 100, top: 100, width: 400, height: 225 };
  const resize = (deltaX, deltaY, direction) => ({
    ...getResizedFloatingRect(startRect, deltaX, deltaY, direction, 1000, 700)
  });

  assert.deepEqual(resize(50, 25, 'se'), { left: 100, top: 100, width: 450, height: 250 });
  assert.deepEqual(resize(-50, 25, 'sw'), { left: 50, top: 100, width: 450, height: 250 });
  assert.deepEqual(resize(50, -25, 'ne'), { left: 100, top: 75, width: 450, height: 250 });
  assert.deepEqual(resize(-50, -25, 'nw'), { left: 50, top: 75, width: 450, height: 250 });
});

test('floating video excludes existing controls from dragging', async () => {
  const { isFloatingVideoInteractiveTarget } = await loadFunctions(
    'floating_video.js',
    ['isFloatingVideoInteractiveTarget']
  );

  assert.equal(isFloatingVideoInteractiveTarget({ closest: () => ({}) }), true);
  assert.equal(isFloatingVideoInteractiveTarget({ closest: () => null }), false);
  assert.equal(isFloatingVideoInteractiveTarget(null), false);
});

test('settings schema includes every persisted option', async () => {
  const { SETTINGS_SCHEMA } = await loadFunctions('user_settings.js', ['SETTINGS_SCHEMA']);

  assert.deepEqual(
    Array.from(SETTINGS_SCHEMA, (setting) => setting.key),
    [
      'autoExpandMenu',
      'showVideoPoster',
      'enableFloatingVideo',
      'enableCenteredDanmukuBox',
      'enableSkipVideo',
      'enableSpeedControlShortcut',
      'enableAutoInputPaymentInfo'
    ]
  );
});

test('package version matches userscript metadata', async () => {
  const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
  const userscript = await readFile(path.join(projectRoot, 'anigamer_kits.user.js'), 'utf8');
  const userscriptVersion = userscript.match(/^\/\/\s+@version\s+(.+)$/m)?.[1];

  assert.equal(userscriptVersion, packageJson.version);
});

test('source and bundled metadata contain no @require directives', async () => {
  const source = await readFile(path.join(projectRoot, 'anigamer_kits.user.js'), 'utf8');
  const bundled = await readFile(path.join(projectRoot, 'dist', 'anigamer_kits.user.js'), 'utf8');

  assert.doesNotMatch(source, /^\/\/\s+@require\s+/m);
  assert.doesNotMatch(bundled, /^\/\/\s+@require\s+/m);
});

test('bundled userscript includes the floating video module', async () => {
  const bundled = await readFile(path.join(projectRoot, 'dist', 'anigamer_kits.user.js'), 'utf8');

  assert.match(bundled, /function initializeFloatingVideo\(\)/);
});
