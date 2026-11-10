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

test('floating video width is a viewport percentage with a locked aspect ratio', async () => {
  const { getFloatingSize } = await loadFunctions('floating_video.js', ['getFloatingSize']);
  const near = (actual, expected) => assert.ok(
    Math.abs(actual - expected) < 1e-6,
    `${actual} is not close to ${expected}`
  );

  assert.deepEqual({ ...getFloatingSize(30, 16 / 9, 1000, 800) }, { width: 300, height: 168.75 });
  // Invalid setting falls back to the 30% default
  assert.deepEqual({ ...getFloatingSize('abc', 16 / 9, 1000, 800) }, { width: 300, height: 168.75 });
  // Never smaller than the minimum width
  assert.deepEqual({ ...getFloatingSize(30, 16 / 9, 600, 800) }, { width: 240, height: 135 });

  // Too tall for a short window: shrinks and keeps 16:9 so it stays above the settings button
  const short = getFloatingSize(100, 16 / 9, 1000, 400);
  near(short.height, 400 - 72 - 20);
  near(short.width / short.height, 16 / 9);
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

  assert.deepEqual(resize(50, 25, 'se'), { left: 100, top: 100, width: 450, height: 253.125 });
  assert.deepEqual(resize(-50, 25, 'sw'), { left: 50, top: 100, width: 450, height: 253.125 });
  assert.deepEqual(resize(50, -25, 'ne'), { left: 100, top: 71.875, width: 450, height: 253.125 });
  assert.deepEqual(resize(-50, -25, 'nw'), { left: 50, top: 71.875, width: 450, height: 253.125 });

  // Vertical drag drives the size when it moved further, ratio stays 16:9
  const tall = resize(10, 100, 'se');
  assert.ok(Math.abs(tall.height - 325) < 1e-6);
  assert.ok(Math.abs(tall.width / tall.height - 16 / 9) < 1e-6);

  // Clamped to the viewport and to the minimum size
  assert.deepEqual(resize(1000, 1000, 'se'), { left: 100, top: 100, width: 900, height: 506.25 });
  assert.deepEqual(resize(-1000, 0, 'se'), { left: 100, top: 100, width: 240, height: 135 });
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

  assert.match(bundled, /function initializeFloatingVideo\(/);
});

test('getNextSpeed steps from rates that are not presets', async () => {
  const { getNextSpeed } = await loadFunctions('utils.js', ['getNextSpeed']);

  assert.equal(getNextSpeed(1, 1), 1.25);
  assert.equal(getNextSpeed(1, -1), 0.75);
  assert.equal(getNextSpeed(1.1, 1), 1.25);
  assert.equal(getNextSpeed(1.1, -1), 1);
  assert.equal(getNextSpeed(2, 1), null);
  assert.equal(getNextSpeed(0.5, -1), null);
  assert.equal(getNextSpeed(3, -1), 2);
});

test('modifySpeed ignores keys typed into text fields', async () => {
  const video = { playbackRate: 1 };
  const document = { querySelector: () => video };
  const { modifySpeed } = await loadFunctions('utils.js', ['modifySpeed'], { document });

  modifySpeed({ shiftKey: true, key: '>', target: { tagName: 'INPUT' } });
  assert.equal(video.playbackRate, 1);
});

test('skipVideo ignores modifier combos and text fields', async () => {
  const video = { duration: 1400, currentTime: 100 };
  const document = { querySelector: () => video };
  const { skipVideo } = await loadFunctions('utils.js', ['skipVideo'], { document });
  const keyEvent = (extra) => ({
    key: '1',
    target: { tagName: 'DIV' },
    preventDefault() {},
    stopPropagation() {},
    stopImmediatePropagation() {},
    ...extra
  });

  skipVideo(keyEvent({ ctrlKey: true }), 89);
  skipVideo(keyEvent({ metaKey: true }), 89);
  skipVideo(keyEvent({ target: { tagName: 'TEXTAREA' } }), 89);
  assert.equal(video.currentTime, 100);

  skipVideo(keyEvent(), 89);
  assert.equal(video.currentTime, 189);
});

test('dark theme cookie treats "0" and missing as disabled', async () => {
  const { isCookieFlagEnabled } = await loadFunctions('utils.js', ['isCookieFlagEnabled']);

  assert.equal(isCookieFlagEnabled(null), false);
  assert.equal(isCookieFlagEnabled('0'), false);
  assert.equal(isCookieFlagEnabled('false'), false);
  assert.equal(isCookieFlagEnabled('1'), true);
});

test('getPosterUrl prefers the video poster, then data-video-poster, then JSON-LD', async () => {
  const posterDocument = ({ videoPoster = null, dataPoster = null, ldJson = [] } = {}) => ({
    querySelector(selector) {
      if (selector === '#ani_video_html5_api') {
        return { getAttribute: (name) => (name === 'poster' ? videoPoster : null) };
      }
      return selector === '#video-container' && dataPoster
        ? { dataset: { videoPoster: dataPoster } }
        : null;
    },
    querySelectorAll: () => ldJson.map((textContent) => ({ textContent }))
  });
  const load = async (document) => (await loadFunctions(
    'poster_menu.js',
    ['getPosterUrl'],
    { document }
  )).getPosterUrl();

  assert.equal(
    await load(posterDocument({
      dataPoster: 'https://p2.bahamut.com.tw/a.jpg',
      ldJson: ['{"@type":"VideoObject","thumbnailUrl":"https://p2.bahamut.com.tw/b.jpg"}']
    })),
    'https://p2.bahamut.com.tw/a.jpg'
  );
  // After an in-page episode switch only the <video> poster is up to date
  assert.equal(
    await load(posterDocument({
      videoPoster: 'https://p2.bahamut.com.tw/next.jpg',
      dataPoster: 'https://p2.bahamut.com.tw/a.jpg'
    })),
    'https://p2.bahamut.com.tw/next.jpg'
  );
  // Malformed block is skipped, VideoObject inside an array is found
  assert.equal(
    await load(posterDocument({
      ldJson: ['{not json', '[{"@type":"BreadcrumbList"},{"@type":"VideoObject","thumbnailUrl":["https://p2.bahamut.com.tw/c.jpg"]}]']
    })),
    'https://p2.bahamut.com.tw/c.jpg'
  );
  // VideoObject nested in @graph
  assert.equal(
    await load(posterDocument({
      ldJson: ['{"@graph":[{"@type":["VideoObject"],"thumbnailUrl":"https://p2.bahamut.com.tw/d.jpg"}]}']
    })),
    'https://p2.bahamut.com.tw/d.jpg'
  );
  assert.equal(await load(posterDocument()), null);
});
