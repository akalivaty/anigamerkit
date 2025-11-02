當目標播放器可見高度 低於 50% 時自動進入 PiP；回到 ≥ 60%（做點回滾緩衝，避免抖動）就退出 PiP。
已處理多影片頁面、動態載入、YouTube/常見播放器選擇器、Safari 與 Chrome 的相容性。

```JS
// ==UserScript==
// @name         Auto PiP when video < 50% visible
// @namespace    your.namespace.here
// @version      1.0.0
// @description  當影片可見高度低於 50% 自動進入 PiP，恢復 ≥ 60% 時退出
// @match        *://*/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  // ===== 設定 =====
  const CONFIG = {
    // 觀察對象（優先外層容器，其次 <video>）
    selectors: [
      // 站點容器
      '#movie_player', '.html5-video-player', // YouTube
      '.bilibili-player', '.bpx-player-container', // bilibili
      '.vjs-player', '.video-js', '.jwplayer', '.plyr',
      '#player', '.player',
      // 原生 <video>
      'video'
    ],
    // 進入/退出 PiP 門檻（含回滾避免抖動）
    enterThreshold: 0.50,
    exitThreshold: 0.60,
    // 針對有固定頂欄的網站可適度內縮視口
    rootMargin: '60px 0px 8px 0px',
    // 僅在影片「正在播放」時才自動進入 PiP
    onlyWhenPlaying: true,
    // 顯示小提示（第一次被瀏覽器拒絕時）
    showHintToast: true,
  };

  // ===== 狀態 =====
  let currentPiPVideo = null;       // 目前在 PiP 的 <video>
  let autoPiPByScript = false;      // 是否由此腳本自動進入的 PiP
  const observed = new WeakSet();   // 已觀察元素
  const videoForNode = new WeakMap(); // 容器 -> 對應的 <video>（若容器非 video）
  let toastTimer = null;

  // ===== 工具 =====
  const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
  const isVideo = (el) => el && el.tagName === 'VIDEO';

  function pickTargets() {
    const nodes = CONFIG.selectors.flatMap(sel => [...document.querySelectorAll(sel)]);
    return uniq(nodes).filter(el => {
      // display:none 的容器忽略；<video> 仍可觀察以供 PiP
      return el.offsetParent !== null || isVideo(el);
    });
  }

  function findVideoFor(target) {
    if (isVideo(target)) return target;
    // 快取查找
    if (videoForNode.has(target)) return videoForNode.get(target);
    // 1) 優先直接尋找後代 video
    let v = target.querySelector && target.querySelector('video');
    // 2) YouTube 主站常見 class
    if (!v && target.classList && target.classList.contains('html5-video-player')) {
      v = target.querySelector('video');
    }
    // 3) 全局退而求其次（避免跨容器誤抓，盡量先用容器）
    if (!v) {
      const rect = target.getBoundingClientRect?.();
      const candidates = [...document.querySelectorAll('video')];
      // 找視覺上重疊最大的 video
      if (rect) {
        let best = null, bestArea = 0;
        for (const cand of candidates) {
          const r = cand.getBoundingClientRect?.();
          if (!r) continue;
          const x = Math.max(0, Math.min(rect.right, r.right) - Math.max(rect.left, r.left));
          const y = Math.max(0, Math.min(rect.bottom, r.bottom) - Math.max(rect.top, r.top));
          const area = x * y;
          if (area > bestArea) { bestArea = area; best = cand; }
        }
        v = best;
      }
    }
    if (v) videoForNode.set(target, v);
    return v || null;
  }

  function buildThresholds() {
    const steps = [];
    for (let i = 0; i <= 100; i++) steps.push(i / 100);
    return steps;
  }

  function calcHeightRatio(entry) {
    const h = entry.intersectionRect?.height ?? 0;
    const H = entry.boundingClientRect?.height || 1;
    return h / H;
  }

  function showToast(msg) {
    if (!CONFIG.showHintToast) return;
    try {
      if (toastTimer) clearTimeout(toastTimer);
      let toast = document.getElementById('__auto_pip_toast__');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = '__auto_pip_toast__';
        toast.style.cssText = `
          position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%);
          padding: 10px 14px; background: rgba(0,0,0,.8); color: #fff;
          border-radius: 8px; font-size: 12px; z-index: 2147483647; pointer-events: none;
        `;
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.opacity = '1';
      toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
    } catch {}
  }

  async function enterPiP(video) {
    if (!video) return;
    if (currentPiPVideo === video && document.pictureInPictureElement === video) return;

    // Chrome/Edge/Firefox（支援 requestPictureInPicture）
    if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
      try {
        await video.requestPictureInPicture();
        currentPiPVideo = video;
        autoPiPByScript = true;
        return;
      } catch (err) {
        // 可能因為瀏覽器要求使用者動作或站點限制
        showToast('瀏覽器拒絕自動 PiP，請手動點一次影片的 PiP，再交給腳本。');
      }
    }

    // Safari（或部分舊版）fallback
    if (typeof video.webkitSetPresentationMode === 'function') {
      try {
        video.webkitSetPresentationMode('picture-in-picture');
        currentPiPVideo = video;
        autoPiPByScript = true;
        return;
      } catch (err) {
        showToast('Safari 阻擋自動 PiP，請手動觸發一次 PiP。');
      }
    }
  }

  async function exitPiP(video) {
    // 僅在「由腳本自動進入」的情境下自動退出，尊重使用者手動 PiP
    if (!autoPiPByScript) return;
    if (!video) video = currentPiPVideo;

    if (document.pictureInPictureElement === video) {
      try {
        await document.exitPictureInPicture();
      } catch {}
    } else if (video && typeof video.webkitSetPresentationMode === 'function') {
      try {
        if (video.webkitPresentationMode === 'picture-in-picture') {
          video.webkitSetPresentationMode('inline');
        }
      } catch {}
    }
    if (video === currentPiPVideo) currentPiPVideo = null;
    autoPiPByScript = false;
  }

  function isPlaying(v) {
    return !!(v && !v.paused && !v.ended && v.readyState >= 2);
  }

  // ===== IntersectionObserver：核心偵測 =====
  const io = new IntersectionObserver((entries) => {
    entries.forEach(async (entry) => {
      const target = entry.target;
      const hRatio = calcHeightRatio(entry); // 實際可見高度比例
      const state = target.dataset._autoPiPState || 'idle'; // idle|pip|ready
      const video = findVideoFor(target);

      // 若找不到對應 <video> 或被跨網域 iframe 包住（拿不到 video），就只能放棄
      if (!video) return;

      // 僅在有播放時才考慮自動 PiP
      if (CONFIG.onlyWhenPlaying && !isPlaying(video)) {
        // 若影片停止播放而我們曾自動進入 PiP，嘗試退出
        if (state === 'pip') {
          await exitPiP(video);
          target.dataset._autoPiPState = 'idle';
        }
        return;
      }

      if (hRatio < CONFIG.enterThreshold) {
        if (state !== 'pip') {
          await enterPiP(video);
          // 若成功，標記狀態
          if (
            (document.pictureInPictureElement === video) ||
            (video.webkitPresentationMode === 'picture-in-picture')
          ) {
            target.dataset._autoPiPState = 'pip';
          }
        }
      } else if (hRatio >= CONFIG.exitThreshold) {
        if (state === 'pip') {
          await exitPiP(video);
          target.dataset._autoPiPState = 'idle';
        }
      }
    });
  }, {
    root: null,
    rootMargin: CONFIG.rootMargin,
    threshold: buildThresholds(),
  });

  function observeAll() {
    for (const el of pickTargets()) {
      if (!observed.has(el)) {
        observed.add(el);
        // 預設狀態
        if (!el.dataset._autoPiPState) el.dataset._autoPiPState = 'idle';
        try { io.observe(el); } catch {}
      }
    }
  }

  // 初次掃描 + 動態監看
  observeAll();
  const mo = new MutationObserver(() => observeAll());
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // 使用者手動離開 PiP：重置狀態
  document.addEventListener('leavepictureinpicture', () => {
    currentPiPVideo = null;
    autoPiPByScript = false;
    // 重置所有觀察目標的狀態，避免卡在 pip
    for (const el of pickTargets()) { el.dataset._autoPiPState = 'idle'; }
  }, true);

  // YouTube 特例：切換分頁/路由後，重新掃描
  window.addEventListener('yt-navigate-finish', observeAll, true);
})();
```

使用小提醒
- 跨網域 iframe（例如外站嵌入的 YouTube）：無法直接存取 iframe 內部的 `<video>`，所以本腳本只對「取得到 `<video>` 的頁面」有效（例如 YouTube 主站、bilibili 主站、一般有 `<video>` 的頁面）。若是嵌入 iframe，瀏覽器本身常已提供 PiP 按鈕，或請在該來源主站打開影片使用本腳本。
- 瀏覽器限制：有些瀏覽器/站點可能要求「使用者手勢」才能啟動 PiP。若第一次自動觸發被拒絕，我有加上一個小黑條提示；請在該頁面手動按一次 PiP（或點影片的 PiP 按鈕/快捷鍵），之後多半就能順利由腳本自動控制。
- 避免抖動：使用 enterThreshold=0.50 與 exitThreshold=0.60 形成遲滯（hysteresis）。你可以依站點 UI（如固定頂欄）把 rootMargin 的上邊距加大一些來微調判定。

如果你想針對某個特定網站（例如 YouTube 或 bilibili）再做更精準的選擇器與例外處理，我可以直接幫你客製化版本。