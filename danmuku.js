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
        danmukuBox.placeholder = 'Enter danmuku here';
        danmukuBox.autocomplete = 'off';
        danmukuBox.style.display = 'none';
        danmukuBox.style.position = 'absolute';
        danmukuBox.style.zIndex = '1000';
        danmukuBox.style.padding = '10px';
        danmukuBox.style.width = '500px';
        danmukuBox.style.borderRadius = '8px';
        danmukuBox.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        danmukuBox.style.fontSize = '16px';
        danmukuBox.style.color = 'black';

        document.documentElement.appendChild(danmukuBox);

        danmukuBox.addEventListener('compositionstart', () => { isComposing = true; });
        danmukuBox.addEventListener('compositionend', () => { isComposing = false; });
    }

    getVideoRect();

    if (danmukuBox.style.display === 'none' || danmukuBox.style.display === '') {
        danmukuBox.style.display = 'block';
        danmukuBox.focus();
        document.addEventListener('keydown', listenDanmuku, true);
    } else {
        closeDanmukuBox();
    }
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

function updateDanmukuBoxPosition() {
    if (!danmukuBox) {
        return;
    }

    setTimeout(() => {
        getVideoRect();
    }, 50);

    // Keep focus in the danmuku box if it was open when the layout changed
    if (danmukuBox.style.display === 'block') {
        danmukuBox.focus();
    }
}

function getVideoRect() {
    const videoElement = document.querySelector('.videoframe');
    if (videoElement) {
        const videoRect = videoElement.getBoundingClientRect();
        const vertialOffset = videoRect.top + videoRect.height / 2;
        const horizontalOffset = videoRect.left + videoRect.width / 2;
        danmukuBox.style.top = `${vertialOffset}px`;
        danmukuBox.style.left = `${horizontalOffset}px`;
        danmukuBox.style.transform = 'translate(-50%, -50%)';
    } else {
        console.error('Video element not found');
    }
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
