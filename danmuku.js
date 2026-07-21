'use strict';

let danmukuBox;
let isComposing = false;

function toggleDanmukuBox(event) {
    if (event.key !== 'Tab') {
        return;
    }

    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) && target.id !== 'custom-input-box') {
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
        console.log('Displaying danmukuBox');
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

    console.log('Hiding danmukuBox');
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

    // Reopen the danmuku box if it was open when the window was resized
    if (danmukuBox.style.display === 'block') {
        danmukuBox.style.display = 'none';
        danmukuBox.style.display = 'block';
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
        console.log('vertialOffset:', vertialOffset, '\thorizontalOffset:', horizontalOffset);
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
    console.log('Danmuku sent:', danmuku);

    if (autoCloseInputBox) {
        closeDanmukuBox();
    }

    return true;
}
