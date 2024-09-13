'use strict';

let danmukuBox;

function toggle_danmukuBox() {
    window.addEventListener('keydown', function (event) {
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

                document.body.appendChild(danmukuBox);
            }

            getVideoRect();

            if (danmukuBox.style.display === 'none' || danmukuBox.style.display === '') {
                console.log('Displaying danmukuBox');
                danmukuBox.style.setProperty('display', 'block', 'important');
                danmukuBox.focus();
                window.addEventListener('keydown', listenDanmuku);
            } else {
                console.log('Hiding danmukuBox');
                danmukuBox.style.display = 'none';
                document.querySelector('video').focus();
                window.removeEventListener('keydown', listenDanmuku);
            }
        }
    });
}

function updateDanmukuBoxPosition() {
    if(!danmukuBox) {
        return;
    }
    
    getVideoRect();

    // Reopen the danmuku box if it was open when the window was resized
    if (danmukuBox.style.display === 'block') {
        danmukuBox.style.display = 'none';
        danmukuBox.style.setProperty('display', 'block', 'important');
        danmukuBox.focus();
    }
}

function getVideoRect() {
    const videoElement = document.querySelector('.videoframe');
    if (videoElement) {
        const videoRect = videoElement.getBoundingClientRect();
        danmukuBox.style.top = `${videoRect.top + videoRect.height / 2}px`;
        danmukuBox.style.left = `${videoRect.left + videoRect.width / 2}px`;
        danmukuBox.style.transform = 'translate(-50%, -50%)';
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