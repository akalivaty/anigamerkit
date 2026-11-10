'use strict';

let danmukuBox;
let isComposing = false;

function toggleDanmukuBox(event) {
    if (event.key !== 'Tab') {
        return;
    }

    // Only take over Tab when focus is on the page itself, the player, or our own box,
    // so keyboard navigation through links and buttons keeps working.
    const target = event.target;
    const isOwnBox = target?.id === 'custom-input-box';
    const isPageOrPlayer = !target
        || target === document.body
        || target === document.documentElement
        || Boolean(target.closest?.('.videoframe'));
    if (!isOwnBox && (!isPageOrPlayer || isEditableTarget(target))) {
        return;
    }

    // Only prevent default Tab behavior when not in IME composition
    if (!isComposing) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    } else {
        // If in IME composition, let the Tab event pass through
        return;
    }

    danmukuBox = document.querySelector('#custom-input-box');
    if (!danmukuBox) {
        danmukuBox = document.createElement('input');
        danmukuBox.id = 'custom-input-box';
        danmukuBox.type = 'text';
        danmukuBox.placeholder = '輸入彈幕...';
        danmukuBox.autocomplete = 'off';
        // Layout and glass look live in the #custom-input-box rule in utils.js
        danmukuBox.style.display = 'none';

        // Keep typing and clicks inside the box from reaching the player's own shortcuts
        for (const type of ['keydown', 'keyup', 'keypress', 'click', 'dblclick']) {
            danmukuBox.addEventListener(type, (event) => event.stopPropagation());
        }

        danmukuBox.addEventListener('compositionstart', () => { isComposing = true; });
        danmukuBox.addEventListener('compositionend', () => { isComposing = false; });
    }

    if (!attachDanmukuBoxToPlayer()) {
        return;
    }

    if (danmukuBox.style.display === 'none' || danmukuBox.style.display === '') {
        danmukuBox.style.display = 'block';
        danmukuBox.focus();
        document.addEventListener('keydown', listenDanmuku, true);
    } else {
        closeDanmukuBox();
    }
}

/**
 * Set how dark the danmuku box's black tint is. Takes effect immediately, even while the box is open.
 * @param {number} percent - Tint opacity from 0 (fully transparent) to 100 (solid black)
 **/
function applyDanmukuBoxOpacity(percent) {
    const value = Math.min(100, Math.max(0, Number(percent) || 0));
    document.documentElement.style.setProperty('--anigamerkit-danmuku-box-alpha', String(value / 100));
}

function closeDanmukuBox() {
    if (!danmukuBox || danmukuBox.style.display !== 'block') {
        return;
    }

    // Don't close the box if IME composition is active
    if (isComposing) {
        return;
    }

    danmukuBox.style.display = 'none';
    const videoElement = document.querySelector('video');
    if (videoElement) {
        videoElement.focus();
    }
    document.removeEventListener('keydown', listenDanmuku, true);
}

/**
 * Move the box into the player (or the fullscreen element wrapping it) so CSS keeps it centered.
 * @returns {boolean} Whether a player container was found
 **/
function attachDanmukuBoxToPlayer() {
    if (!danmukuBox) {
        return false;
    }

    const fullscreenElement = document.fullscreenElement;
    const container = fullscreenElement?.querySelector?.('video')
        ? fullscreenElement
        : document.querySelector('.videoframe');
    if (!container) {
        console.error('Video player not found');
        return false;
    }

    // top/left 50% resolve against the nearest positioned ancestor
    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }

    if (danmukuBox.parentNode !== container) {
        const wasOpen = danmukuBox.style.display === 'block';
        container.appendChild(danmukuBox);
        // Re-parenting drops focus
        if (wasOpen) {
            danmukuBox.focus();
        }
    }
    return true;
}

function listenDanmuku(event) {
    // During IME composition, do not trigger send.
    if (event.isComposing || isComposing || event.keyCode === 229) {
        return;
    }

    if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        const inputBox = document.querySelector('#custom-input-box');
        if (!inputBox) {
            return;
        }

        const danmuku = inputBox.value.trim();
        if (danmuku && sendDanmuku(danmuku)) {
            inputBox.value = '';
        }
    }
}

function sendDanmuku(danmuku, autoCloseInputBox = true) {
    const danmuInput = document.querySelector('#danmutxt');
    const sendButton = document.querySelector('.danmu-send_btn');
    if (!danmuInput || !sendButton) {
        console.error('Danmuku input or send button not found');
        return false;
    }

    danmuInput.value = danmuku;
    sendButton.click();

    if (autoCloseInputBox) {
        closeDanmukuBox();
    }

    return true;
}
