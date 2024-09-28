'use strict';

let danmukuBox;

function toggleDanmukuBox(event) {
    if (event.key === 'F1') {
        event.preventDefault();

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
            danmukuBox.style.fontSize = '16px';
            danmukuBox.style.width = '500px';
            danmukuBox.style.borderRadius = '8px';
            danmukuBox.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';

            document.documentElement.appendChild(danmukuBox);
        }

        getVideoRect();

        if (danmukuBox.style.display === 'none' || danmukuBox.style.display === '') {
            console.log('Displaying danmukuBox');
            danmukuBox.style.display = 'block';
            danmukuBox.focus();
            document.addEventListener('keydown', listenDanmuku);
        } else {
            console.log('Hiding danmukuBox');
            danmukuBox.style.display = 'none';
            document.querySelector('video').focus();
            document.removeEventListener('keydown', listenDanmuku);
        }
    }
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
    if (event.key === 'Enter') {
        const danmukuBox = document.querySelector('#custom-input-box');
        if (danmukuBox) {
            let danmuku = danmukuBox.value;
            danmukuBox.value = '';
            sendDanmuku(danmuku);
        }
    }
}

function sendDanmuku(danmuku) {
    const danmuInput = document.querySelector('#danmutxt');
    const sendButton = document.querySelector('.danmu-send_btn');
    danmuInput.value = danmuku;
    sendButton.click();
    console.log('Danmuku sent:', danmuku);
}