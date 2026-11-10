'use strict';

const SPEED_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/**
 * Run the callback once the DOM is parsed (or immediately if it already is).
 * @param {Function} callback
 * @returns {void}
 **/
function onDomReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
}

/**
 * Run the callback after window load (or immediately if the page has already loaded).
 * @param {Function} callback
 * @returns {void}
 **/
function onWindowLoad(callback) {
    if (document.readyState === 'complete') {
        callback();
    } else {
        window.addEventListener('load', callback, { once: true });
    }
}

/**
 * Resolve with the first element matching the selector, or null after the timeout.
 * @param {string} selector
 * @param {number} timeout - Milliseconds to wait before giving up
 * @returns {Promise<Element|null>}
 **/
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve) => {
        const existing = document.querySelector(selector);
        if (existing) {
            resolve(existing);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                clearTimeout(timer);
                resolve(element);
            }
        });
        const timer = setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
        observer.observe(document.documentElement, { childList: true, subtree: true });
    });
}

function isEditableTarget(target) {
    return Boolean(target && (
        target.tagName === 'INPUT'
        || target.tagName === 'TEXTAREA'
        || target.tagName === 'SELECT'
        || target.isContentEditable
    ));
}

function hasCommandModifier(event) {
    return Boolean(event.ctrlKey || event.metaKey || event.altKey);
}

/**
 * Pick the next preset speed above (direction > 0) or below (direction < 0) the current rate.
 * Works even when the current rate is not one of the presets.
 * @param {number} currentRate
 * @param {number} direction
 * @returns {number|null} The next speed, or null when already at the limit
 **/
function getNextSpeed(currentRate, direction) {
    const epsilon = 1e-6;
    if (direction > 0) {
        return SPEED_STEPS.find((speed) => speed > currentRate + epsilon) ?? null;
    }
    return [...SPEED_STEPS].reverse().find((speed) => speed < currentRate - epsilon) ?? null;
}

function setInputValue(input, value) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

function isCookieFlagEnabled(value) {
    return value !== null && !['', '0', 'false', 'off'].includes(String(value).toLowerCase());
}

function injectStyles() {
    const css = `
        .anigamerkit-settings-panel {
            display: flex;
            flex-direction: column;
            position: fixed;
            right: 20px;
            bottom: 60px;
            width: 520px;
            max-width: calc(100vw - 40px);
            max-height: 50vh;
            min-height: 280px;
            box-sizing: border-box;
            padding: 10px 15px;
            margin-bottom: 20px;
            background-color: rgba(255, 255, 255, 0.7);
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            z-index: 2147483647;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .anigamerkit-settings-panel.is-visible {
            opacity: 1;
        }

        .anigamerkit-settings-title {
            font-weight: bold;
            text-align: center;
            font-size: 20px;
            user-select: none;
        }

        .anigamerkit-settings-options {
            display: flex;
            flex: 1 1 auto;
            flex-direction: column;
            min-height: 0;
            margin-top: 10px;
            overflow-y: auto;
        }

        .anigamerkit-settings-option {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }

        .anigamerkit-settings-checkbox {
            width: 20px;
            height: 20px;
            /* Native checkbox tinted to match the Apply button */
            accent-color: rgb(64, 195, 221);
        }

        .anigamerkit-settings-label {
            margin-left: 5px;
            font-size: 16px;
            user-select: none;
        }

        .anigamerkit-settings-input {
            position: relative;
            bottom: 1px;
            width: 100px;
            height: 25px;
            box-sizing: border-box;
            margin-left: 8px;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 14px;
            outline: none;
        }

        .anigamerkit-settings-apply {
            flex-shrink: 0;
            align-self: center;
            margin: 5px;
            padding: 10px 20px;
            background-color: rgba(64, 195, 221, 0.9);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        .anigamerkit-settings-dark-text {
            color: black;
        }

        .anigamerkit-floating-video {
            position: fixed !important;
            right: auto !important;
            bottom: auto !important;
            width: 30vw;
            aspect-ratio: 16 / 9;
            min-width: min(240px, calc(100vw - 32px)) !important;
            min-height: min(135px, calc(100vh - 88px)) !important;
            max-width: calc(100vw - 32px) !important;
            max-height: calc(100vh - 88px) !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            overflow: hidden;
            background: #000;
            border-radius: 8px;
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
            cursor: grab;
            /* Stays below the settings button and panel (2147483647) so they are never covered */
            z-index: 2147483640 !important;
        }

        .anigamerkit-floating-video.is-dragging {
            cursor: grabbing;
        }

        .anigamerkit-floating-video .vjs-control-bar {
            cursor: default;
        }

        .anigamerkit-floating-video .vjs-control {
            cursor: pointer;
        }

        .anigamerkit-floating-resize-handle {
            position: absolute;
            box-sizing: border-box;
            z-index: 2147483647;
            touch-action: none;
            user-select: none;
            width: 20px;
            height: 20px;
            border: 0;
            background: transparent;
            filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.85));
            opacity: 0;
            transition: opacity 0.15s ease;
        }

        .anigamerkit-floating-video:hover .anigamerkit-floating-resize-handle {
            opacity: 0.72;
        }

        .anigamerkit-floating-resize-handle:hover,
        .anigamerkit-floating-resize-handle:active {
            opacity: 1;
        }

        .anigamerkit-floating-resize-handle.is-nw {
            top: 0;
            left: 0;
            border-top: 3px solid white;
            border-left: 3px solid white;
            cursor: nwse-resize;
        }

        .anigamerkit-floating-resize-handle.is-ne {
            top: 0;
            right: 0;
            border-top: 3px solid white;
            border-right: 3px solid white;
            cursor: nesw-resize;
        }

        .anigamerkit-floating-resize-handle.is-sw {
            bottom: 0;
            left: 0;
            border-bottom: 3px solid white;
            border-left: 3px solid white;
            cursor: nesw-resize;
        }

        .anigamerkit-floating-resize-handle.is-se {
            right: 0;
            bottom: 0;
            border-right: 3px solid white;
            border-bottom: 3px solid white;
            cursor: nwse-resize;
        }

        .anigamerkit-episode-poster {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            background-color: #000;
            pointer-events: none;
        }

        .anigamerkit-context-menu {
            position: fixed;
            z-index: 2147483647;
            min-width: 150px;
            padding: 4px 0;
            box-sizing: border-box;
            background-color: rgba(255, 255, 255, 0.95);
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            font-size: 14px;
        }

        .anigamerkit-context-menu-item {
            display: block;
            width: 100%;
            padding: 8px 14px;
            border: 0;
            background: transparent;
            color: #222;
            font-size: 14px;
            text-align: left;
            cursor: pointer;
        }

        .anigamerkit-context-menu-item:hover:not(:disabled),
        .anigamerkit-context-menu-item:focus-visible {
            background-color: rgba(64, 195, 221, 0.18);
            outline: none;
        }

        .anigamerkit-context-menu-item:disabled {
            color: #999;
            cursor: default;
        }

        .anigamerkit-context-menu.is-dark {
            background-color: rgba(40, 40, 40, 0.95);
            border-color: #4a4a4a;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .anigamerkit-context-menu.is-dark .anigamerkit-context-menu-item {
            color: #eee;
        }

        .anigamerkit-context-menu.is-dark .anigamerkit-context-menu-item:hover:not(:disabled),
        .anigamerkit-context-menu.is-dark .anigamerkit-context-menu-item:focus-visible {
            background-color: rgba(64, 195, 221, 0.3);
        }

        .anigamerkit-context-menu.is-dark .anigamerkit-context-menu-item:disabled {
            color: #777;
        }

        .anigamerkit-quiz-button {
            position: fixed;
            right: 70px;
            bottom: 20px;
            width: 40px;
            height: 40px;
            padding: 0;
            border: none;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.9);
            color: rgba(64, 195, 221, 0.9);
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            z-index: 2147483647;
        }

        .anigamerkit-quiz-button:disabled {
            cursor: progress;
            opacity: 0.6;
        }

        .anigamerkit-quiz-dialog {
            width: min(480px, calc(100vw - 32px));
            box-sizing: border-box;
            padding: 16px 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background-color: #fff;
            color: #222;
            font-size: 15px;
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
        }

        .anigamerkit-quiz-dialog::backdrop {
            background: rgba(0, 0, 0, 0.45);
        }

        .anigamerkit-quiz-dialog.is-dark {
            border-color: #4a4a4a;
            background-color: #282828;
            color: #eee;
        }

        .anigamerkit-quiz-title {
            margin: 0 0 4px;
            font-size: 20px;
            font-weight: bold;
        }

        .anigamerkit-quiz-game {
            color: #888;
            font-size: 13px;
        }

        .anigamerkit-quiz-question {
            margin: 12px 0;
            line-height: 1.6;
        }

        .anigamerkit-quiz-options {
            display: grid;
            gap: 8px;
        }

        .anigamerkit-quiz-option {
            padding: 8px 12px;
            border: 1px solid rgba(128, 128, 128, 0.45);
            border-radius: 6px;
            background: transparent;
            color: inherit;
            font-size: 15px;
            text-align: left;
            cursor: pointer;
        }

        .anigamerkit-quiz-option:hover:not(:disabled),
        .anigamerkit-quiz-option.is-selected {
            border-color: rgb(64, 195, 221);
            background-color: rgba(64, 195, 221, 0.18);
        }

        .anigamerkit-quiz-option:disabled {
            cursor: default;
        }

        .anigamerkit-quiz-result {
            margin: 12px 0 0;
            font-weight: bold;
        }

        .anigamerkit-quiz-result.is-correct {
            color: rgb(40, 167, 69);
        }

        .anigamerkit-quiz-result.is-wrong {
            color: rgb(220, 53, 69);
        }

        .anigamerkit-quiz-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 14px;
        }

        .anigamerkit-quiz-action {
            padding: 6px 16px;
            border: none;
            border-radius: 5px;
            background-color: rgba(64, 195, 221, 0.9);
            color: white;
            cursor: pointer;
        }

        .anigamerkit-player-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 14px 0;
        }

        .anigamerkit-toolbar-toggle {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 5px 12px;
            border: 1px solid rgba(128, 128, 128, 0.45);
            border-radius: 8px;
            background: transparent;
            color: inherit;
            font-size: 14px;
            line-height: 20px;
            cursor: pointer;
            user-select: none;
            transition: background-color 0.15s, border-color 0.15s, color 0.15s;
        }

        .anigamerkit-toolbar-toggle .material-icons-round {
            font-size: 18px;
        }

        .anigamerkit-toolbar-toggle:hover:not(:disabled) {
            border-color: rgb(64, 195, 221);
        }

        .anigamerkit-toolbar-toggle:focus-visible {
            outline: 2px solid rgb(64, 195, 221);
            outline-offset: 2px;
        }

        .anigamerkit-toolbar-toggle.is-active {
            border-color: rgb(64, 195, 221);
            background-color: rgba(64, 195, 221, 0.9);
            color: white;
        }

        .anigamerkit-toolbar-toggle:disabled {
            opacity: 0.5;
            cursor: default;
        }

        #custom-input-box {
            z-index: 2147483647 !important;
        }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * Filter the page based on URL patterns and apply settings.
 * @param {Object} DEFAULT_SETTINGS - An object containing user's settings for the script
 * @returns {void}
 **/
function filterPage(DEFAULT_SETTINGS) {

    const currentUrl = new URL(window.location.href);
    const pageType = getPageType(currentUrl);

    if (pageType === 'home') {
        if (GM_getValue('autoExpandMenu', DEFAULT_SETTINGS.autoExpandMenu)) {
            triggerShowMoreButton();
        }
    } else if (pageType === 'video') {
        initializePlayerToolbar(DEFAULT_SETTINGS);

        if (GM_getValue('showVideoPoster', DEFAULT_SETTINGS.showVideoPoster)) {
            showVideoPoster();
        }

        if (GM_getValue('enableFloatingVideo', DEFAULT_SETTINGS.enableFloatingVideo)) {
            initializeFloatingVideo(() => GM_getValue(
                'floatingVideoWidthPercent',
                DEFAULT_SETTINGS.floatingVideoWidthPercent
            ));
        }

        if (GM_getValue('enableCenteredDanmukuBox', DEFAULT_SETTINGS.enableCenteredDanmukuBox)) {
            document.addEventListener('fullscreenchange', attachDanmukuBoxToPlayer);
            document.addEventListener('keydown', toggleDanmukuBox, true);
        }

        if (GM_getValue('enableSpeedControlShortcut', DEFAULT_SETTINGS.enableSpeedControlShortcut)) {
            document.addEventListener('keydown', modifySpeed);
        }

        if (GM_getValue('enableSkipVideo', DEFAULT_SETTINGS.enableSkipVideo)) {
            const skipDuration = GM_getValue('skipDuration', DEFAULT_SETTINGS.skipDuration);
            const skipHandler = (event) => skipVideo(event, skipDuration);
            document.addEventListener('keydown', skipHandler, true);
        }

    } else if (pageType === 'payment') {
        if (GM_getValue('enableAutoInputPaymentInfo', DEFAULT_SETTINGS.enableAutoInputPaymentInfo)) {
            const phoneBarcode = GM_getValue('phoneBarcode', null);
            waitForElement('input.checkBtns, .payment-form-invoice').then(() => {
                autoInputPaymentInfo(phoneBarcode);
            });
        }
    }
}

function getPageType(url) {
    const hasNumericParam = (name) => /^\d+$/.test(url.searchParams.get(name) || '');

    if (url.pathname === '/') {
        return 'home';
    }
    if (url.pathname === '/animeVideo.php' && hasNumericParam('sn')) {
        return 'video';
    }
    if (url.pathname.startsWith('/party')) {
        return 'video';
    }
    if (url.pathname === '/animePay2.php' && hasNumericParam('itemSn')) {
        return 'payment';
    }
    return 'unknown';
}

function triggerShowMoreButton() {
    // The site binds the button's click handler late, so a click before window load does nothing
    onWindowLoad(() => {
        waitForElement('.btn-show-more').then((showMoreBtn) => {
            if (showMoreBtn) {
                showMoreBtn.click();
            } else {
                console.error('Button with class "btn-show-more" not found.');
            }
        });
    });
}

function showVideoPoster() {
    // Hide R18 overlays with a stylesheet instead of watching every DOM mutation
    const style = document.createElement('style');
    style.textContent = '.R18 { display: none !important; }';
    document.head.appendChild(style);

    // Auto agree to adult check; delegated so it also works for a video added later
    document.addEventListener('click', (event) => {
        if (event.button !== 0 || !event.target?.closest?.('video')) {
            return;
        }
        const agreeBtn = document.getElementById('adult');
        if (agreeBtn) {
            agreeBtn.click();
        }
    }, true);

    // Right-click on the player: copy the poster image or URL
    initializePosterMenu();

    // Show the next episode's poster after an in-page episode switch
    initializeEpisodePoster();
}

function modifySpeed(event) {
    if (!event.shiftKey || (event.key !== '>' && event.key !== '<')) {
        return;
    }
    if (hasCommandModifier(event) || isEditableTarget(event.target)) {
        return;
    }

    const video = document.querySelector('video');
    if (!video) {
        return;
    }

    const nextSpeed = getNextSpeed(video.playbackRate, event.key === '>' ? 1 : -1);
    if (nextSpeed === null) {
        return;
    }
    video.playbackRate = nextSpeed;
    showFloatingMessage(nextSpeed + "X", 500, 'video-bottom-right');
}

function skipVideo(event, duration) {
    // Match the physical key: Shift + 1 types '!' or other symbols depending on the keyboard layout
    if (event.code !== 'Digit1' || !event.shiftKey
        || hasCommandModifier(event) || isEditableTarget(event.target)) {
        return;
    }

    const video = document.querySelector('video');
    if (!video || video.duration <= 10) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    video.currentTime += parseInt(duration, 10);
}

function autoInputPaymentInfo(phoneBarcode = null) {

    const invoiceChoice = document.querySelector('.payment-form-invoice');
    if (invoiceChoice) {
        const noDonateInvoice = document.querySelector('#e2');
        if (noDonateInvoice) {
            noDonateInvoice.click();
        }
        const invoiceTypeSelect = document.querySelector('select.anime-select--invoice');
        if (invoiceTypeSelect) {
            invoiceTypeSelect.value = '3';
            invoiceTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            if (phoneBarcode) {
                // The barcode field may only render after the select's change handler runs
                waitForElement('input[name="cell-cardno"]', 3000).then((phoneBarcodeInput) => {
                    if (phoneBarcodeInput) {
                        setInputValue(phoneBarcodeInput, phoneBarcode);
                    }
                });
            }
        }
    }

    // auto check all checkboxes
    const checkBoxList = document.querySelectorAll('input.checkBtns');
    checkBoxList.forEach(checkbox => {
        if (!checkbox.checked) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}

function showFloatingMessage(message, duration = 2000, position = 'bottom-center') {

    const existingMsg = document.getElementById('floatingMessage');
    if (existingMsg) {
        existingMsg.parentNode.removeChild(existingMsg);
    }

    const msg = document.createElement('div');
    msg.id = 'floatingMessage';
    msg.textContent = message;
    msg.style.position = 'fixed';
    msg.style.fontSize = '24px';
    msg.style.fontWeight = 'bold';
    msg.style.padding = '20px';
    msg.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    msg.style.color = 'white';
    msg.style.borderRadius = '10px';
    msg.style.zIndex = '2147483647';
    msg.style.pointerEvents = 'none';
    msg.style.opacity = '0';
    msg.style.transition = 'opacity 0.3s';

    // In fullscreen only the fullscreen element's subtree is rendered
    (document.fullscreenElement || document.documentElement).appendChild(msg);

    switch (position) {
        case 'bottom-center':
            msg.style.bottom = '20px';
            msg.style.left = '50%';
            msg.style.transform = 'translateX(-50%)';
            break;
        case 'bottom-right':
            msg.style.bottom = '20px';
            msg.style.right = '5%';
            msg.style.transform = 'none';
            break;
        case 'bottom-left':
            msg.style.bottom = '20px';
            msg.style.left = '5%';
            msg.style.transform = 'none';
            break;
        case 'video-bottom-right':
            const video = document.querySelector('video');
            if (video) {
                const videoRect = video.getBoundingClientRect();
                msg.style.top = `${videoRect.bottom - msg.offsetHeight - 20}px`;
                msg.style.left = `${videoRect.right - msg.offsetWidth - 20}px`;
                msg.style.transform = 'none';
            }
            break;
        default:
            msg.style.bottom = '20px';
            msg.style.left = '50%';
            msg.style.transform = 'translateX(-50%)';
            break;
    }



    // Trigger the fade-in effect
    requestAnimationFrame(() => {
        msg.style.opacity = '1';
    });

    // Trigger the fade-out effect after 2 seconds (2000 ms)
    setTimeout(() => {
        msg.style.opacity = '0';
    }, duration);

    // Remove the message from the DOM after the fade-out completes
    setTimeout(() => {
        if (msg && msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    }, duration + 500); // Total duration (fade-in + visible + fade-out)
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}
