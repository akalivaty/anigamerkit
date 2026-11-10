'use strict';

const POSTER_MENU_EDGE_GAP = 4;
const POSTER_DOWNLOAD_TIMEOUT = 15000;

let posterMenu = null;
let posterMenuListeners = null;

const EPISODE_POSTER_VIDEO_SELECTOR = '#ani_video_html5_api';
const EPISODE_POSTER_WAIT_TIMEOUT = 30000;

/**
 * Whether the right-click menu should offer the current frame: playback of this
 * episode has started, no ad is playing and the episode-switch poster is not shown.
 * @param {HTMLVideoElement|null} video
 * @returns {boolean}
 **/
function canCaptureVideoFrame(video) {
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        return false;
    }
    const player = video.closest('.video-js');
    if (!player?.classList.contains('vjs-has-started')
        || player.classList.contains('vjs-anigamer-m3u8-ad-playing')) {
        return false;
    }
    const episodePoster = player.querySelector('.anigamerkit-episode-poster');
    return !episodePoster || episodePoster.hidden;
}

/**
 * Draw the frame on screen right now at the video's native resolution.
 * The stream is a same-origin MSE blob without DRM, so the canvas is not tainted.
 * @returns {HTMLCanvasElement|null}
 **/
function captureVideoFrame(video) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas;
    } catch (error) {
        console.error('Failed to capture video frame:', error);
        return null;
    }
}

/**
 * Read the current episode's poster URL.
 * Prefers the <video> poster (the site updates it on in-page episode switches),
 * then the server-rendered data-video-poster, then the JSON-LD VideoObject.
 * @returns {string|null}
 **/
function getPosterUrl() {
    const fromVideo = document.querySelector(EPISODE_POSTER_VIDEO_SELECTOR)?.getAttribute('poster');
    if (fromVideo) {
        return fromVideo;
    }

    const fromData = document.querySelector('#video-container')?.dataset?.videoPoster;
    if (fromData) {
        return fromData;
    }

    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
            const parsed = JSON.parse(script.textContent);
            const items = [].concat(parsed).flatMap((item) => [item, ...[].concat(item?.['@graph'] ?? [])]);
            const video = items.find((item) => [].concat(item?.['@type']).includes('VideoObject'));
            const thumbnail = [].concat(video?.thumbnailUrl ?? [])[0];
            if (thumbnail) {
                return thumbnail;
            }
        } catch {
            // Ignore malformed JSON-LD blocks
        }
    }
    return null;
}

/**
 * Switching episodes (下一集 / episode list) keeps the same <video> and MediaSource
 * and only swaps its poster attribute. Browsers show a poster only until the first
 * frame is rendered, so the previous episode's last frame stays on screen.
 * Cover the video with the new poster until playback starts.
 **/
function initializeEpisodePoster() {
    waitForElement(EPISODE_POSTER_VIDEO_SELECTOR, EPISODE_POSTER_WAIT_TIMEOUT).then((video) => {
        if (!video) {
            return;
        }

        const overlay = document.createElement('img');
        overlay.className = 'anigamerkit-episode-poster';
        overlay.alt = '';
        overlay.hidden = true;
        // Right after the video so the player's own layers (stop mask, age gate, controls) stay on top
        video.after(overlay);

        const hide = () => {
            overlay.hidden = true;
            overlay.removeAttribute('src');
        };

        new MutationObserver((records) => {
            const poster = video.getAttribute('poster');
            const changed = records.some((record) => record.oldValue !== poster);
            if (!poster) {
                hide();
            } else if (changed && video.paused) {
                overlay.src = poster;
                overlay.hidden = false;
            }
        }).observe(video, { attributes: true, attributeFilter: ['poster'], attributeOldValue: true });

        video.addEventListener('playing', hide);
    });
}

function initializePosterMenu() {
    // Capture on window so the menu wins over the player's own contextmenu handlers.
    // Shift + right-click keeps the browser's native menu.
    window.addEventListener('contextmenu', (event) => {
        if (event.shiftKey || !event.target?.closest?.('.videoframe')) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        openPosterMenu(event.clientX, event.clientY);
    }, true);
}

function openPosterMenu(x, y) {
    closePosterMenu();

    const posterUrl = getPosterUrl();
    // Grab the frame now, so it matches the moment of the right-click even if playback goes on
    const video = document.querySelector(EPISODE_POSTER_VIDEO_SELECTOR);
    const frameCanvas = canCaptureVideoFrame(video) ? captureVideoFrame(video) : null;

    const menu = document.createElement('div');
    menu.className = 'anigamerkit-context-menu';
    // Read on every open so switching the site theme applies without a reload
    menu.classList.toggle('is-dark', isCookieFlagEnabled(getCookie('ANIME_dark_theme')));
    menu.setAttribute('role', 'menu');

    const actions = [
        ...(frameCanvas ? [['複製當前畫面', () => copyVideoFrame(frameCanvas), true]] : []),
        ['複製封面圖片', () => copyPosterImage(posterUrl), Boolean(posterUrl)],
        ['複製封面網址', () => copyPosterUrl(posterUrl), Boolean(posterUrl)]
    ];
    for (const [label, action, enabled] of actions) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'anigamerkit-context-menu-item';
        item.setAttribute('role', 'menuitem');
        item.textContent = label;
        item.disabled = !enabled;
        item.addEventListener('click', (event) => {
            event.stopPropagation();
            closePosterMenu();
            action();
        });
        menu.appendChild(item);
    }
    if (!posterUrl) {
        menu.title = '找不到封面圖';
    }

    // In fullscreen only the fullscreen element's subtree is rendered
    (document.fullscreenElement || document.body).appendChild(menu);
    menu.style.left = `${Math.max(0, Math.min(x, window.innerWidth - menu.offsetWidth - POSTER_MENU_EDGE_GAP))}px`;
    menu.style.top = `${Math.max(0, Math.min(y, window.innerHeight - menu.offsetHeight - POSTER_MENU_EDGE_GAP))}px`;
    posterMenu = menu;

    posterMenuListeners = new AbortController();
    const { signal } = posterMenuListeners;
    document.addEventListener('pointerdown', (event) => {
        if (!menu.contains(event.target)) {
            closePosterMenu();
        }
    }, { capture: true, signal });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closePosterMenu();
        }
    }, { capture: true, signal });
    window.addEventListener('scroll', closePosterMenu, { capture: true, signal });
    window.addEventListener('resize', closePosterMenu, { signal });
    window.addEventListener('blur', closePosterMenu, { signal });
    document.addEventListener('fullscreenchange', closePosterMenu, { signal });
}

function closePosterMenu() {
    posterMenuListeners?.abort();
    posterMenuListeners = null;
    posterMenu?.remove();
    posterMenu = null;
}

function copyPosterUrl(url) {
    if (!navigator.clipboard?.writeText) {
        showFloatingMessage('瀏覽器不支援複製到剪貼簿');
        return;
    }
    navigator.clipboard.writeText(url)
        .then(() => showFloatingMessage('已複製封面網址'))
        .catch((error) => {
            console.error('Failed to copy poster URL:', error);
            showFloatingMessage('複製網址失敗');
        });
}

function copyPosterImage(url) {
    writePngToClipboard(() => downloadImageBlob(url).then(convertImageToPng), '已複製封面圖片');
}

function copyVideoFrame(canvas) {
    writePngToClipboard(() => canvasToPng(canvas), '已複製當前畫面');
}

/**
 * @param {Function} createPngBlob - Returns a promise of the PNG blob
 **/
function writePngToClipboard(createPngBlob, successMessage) {
    if (!navigator.clipboard?.write || typeof ClipboardItem !== 'function') {
        showFloatingMessage('瀏覽器不支援複製圖片');
        return;
    }

    // Hand the clipboard a promise right away so the click's user activation
    // still counts while the image is prepared (required by Safari).
    const pngBlob = createPngBlob();
    pngBlob.catch(() => {}); // Reported through clipboard.write below

    navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })])
        .then(() => showFloatingMessage(successMessage))
        .catch((error) => {
            console.error('Failed to copy image:', error);
            showFloatingMessage('複製圖片失敗');
        });
}

/**
 * The poster lives on another domain (bahamut.com.tw), so download it through
 * GM_xmlhttpRequest instead of fetch to avoid CORS.
 **/
function downloadImageBlob(url) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url,
            responseType: 'blob',
            timeout: POSTER_DOWNLOAD_TIMEOUT,
            onload: (response) => {
                if (response.status >= 200 && response.status < 300 && response.response) {
                    resolve(response.response);
                } else {
                    reject(new Error(`Poster download failed: HTTP ${response.status}`));
                }
            },
            onerror: () => reject(new Error('Poster download failed: network error')),
            ontimeout: () => reject(new Error('Poster download timed out'))
        });
    });
}

/**
 * Clipboards only reliably accept PNG, so redraw the JPG on a canvas.
 **/
async function convertImageToPng(blob) {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvasToPng(canvas);
}

function canvasToPng(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((png) => {
            if (png) {
                resolve(png);
            } else {
                reject(new Error('PNG conversion failed'));
            }
        }, 'image/png');
    });
}
