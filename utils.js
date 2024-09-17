'use strict';

function injectStyles() {
    const css = `
        .fade-in {
            opacity: 1 !important;
        }
        .fade-out {
            opacity: 0 !important;
        }
            
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

function filterPage(URL_PATTERNS, DEFAULT_SETTINGS) {
    const current_url = window.location.href;

    if (URL_PATTERNS.HOME_PAGE.test(current_url)) {
        // If homepage
        console.log("here is homepage");

        if (GM_getValue('autoExpandMenu', DEFAULT_SETTINGS.autoExpandMenu)) {
            triggerShowMoreButton();
        }
    } else if (URL_PATTERNS.VIDEO_PAGE.test(current_url) || URL_PATTERNS.PARTY_PAGE.test(current_url)) {
        // If video page
        console.log("here is video page, " + current_url);

        if (GM_getValue('enableCenteredDanmukuBox', DEFAULT_SETTINGS.enableCenteredDanmukuBox)) {
            document.addEventListener('fullscreenchange', updateDanmukuBoxPosition);
            document.addEventListener('keydown', toggleDanmukuBox);
            document.addEventListener('keydown', modifySpeed);
        }

    } else {
        console.log("test failed");
    }
}

function triggerShowMoreButton() {
    const showMoreBtn = document.querySelector('.btn-show-more');
    if (showMoreBtn) {
        showMoreBtn.click();
    } else {
        console.error('Button with class "btn-show-more" not found.');
    }
}

function modifySpeed(event) {
    const video = document.querySelector('video');

    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    let currentSpeedIndex = speeds.indexOf(video.playbackRate);

    if (event.shiftKey && event.key === '>') {
        // speed up
        if (currentSpeedIndex < speeds.length - 1) {
            currentSpeedIndex++;
            video.playbackRate = speeds[currentSpeedIndex];
            showFloatingMessage(video.playbackRate + "X", 500, 'bottom-right');
        }
    } else if (event.shiftKey && event.key === '<') {
        // speed down
        if (currentSpeedIndex > 0) {
            currentSpeedIndex--;
            video.playbackRate = speeds[currentSpeedIndex];
            showFloatingMessage(video.playbackRate + "X", 500, 'bottom-right');
        }
    }
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
    msg.style.zIndex = '1001';
    msg.style.opacity = '0';
    msg.style.transition = 'opacity 0.3s';

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
        default:
            msg.style.bottom = '20px';
            msg.style.left = '50%';
            msg.style.transform = 'translateX(-50%)';
            break;
    }


    document.documentElement.appendChild(msg);

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

// function getCSRFToken() {
//     return fetch('https://ani.gamer.com.tw/ajax/getCSRFToken.php', {
//         method: 'GET',
//         credentials: 'include', // Include cookies in the request
//         headers: {
//             'cache-control': 'max-age=0',
//             'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128"',
//             'dnt': '1',
//             'sec-ch-ua-mobile': '?0',
//             'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
//             'sec-ch-ua-platform': '"Windows"',
//             'accept': '*/*',
//             'sec-fetch-site': 'same-origin',
//             'sec-fetch': 'cors',
//             'sec-fetch-dest': 'empty',
//             'referer': window.location.href,
//             'accept-encoding': 'gzip, deflate, br, zstd',
//             'accept-language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7',
//             'cookie': document.cookie // Include all cookies
//         }
//     })
//         .then(response => response.text()) // Get response as text first
//         .then(text => {
//             console.log('Response text:', text); // Log the response text for debugging
//             return text;
//         })
//         .catch(error => {
//             console.error('Error fetching CSRF token:', error);
//         });
// }

// function sendDanmuku_request(danmuku) {

//     const timeElement = document.querySelector('.vjs-current-time-display');
//     const currentTimeInMilis = timeElement ? (() => {
//         const timeText = timeElement.textContent; // e.g. '16:34'
//         const [minutes, seconds] = timeText.split(':').map(Number); // e.g. [16, 34]
//         return Number.isNaN(minutes) || Number.isNaN(seconds) ? '0' : ((minutes * 60 + seconds) * 10).toString();
//     })() : '0';

//     const token = getCSRFToken().then(token => {
//         console.log('CSRF Token:', token);
//     });

//     const data = new URLSearchParams({
//         sn: current_url.split('sn=')[1],
//         content: danmuku,
//         color: '#FFFFFF',
//         position: '0',
//         size: '1',
//         time: currentTimeInMilis,
//         token: token
//     });

//     fetch('https://ani.gamer.com.tw/ajax/danmuSet.php', {
//         method: 'POST',
//         headers: {
//             'content-length': data.toString().length,
//             'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128"',
//             'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
//             'dnt': '1',
//             'sec-ch-ua-mobile': '?0',
//             'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
//             'sec-ch-ua-platform': '"Windows"',
//             'accept': '*/*',
//             'origin': 'https://ani.gamer.com.tw',
//             'sec-fetch-site': 'same-origin',
//             'sec-fetch-mode': 'cors',
//             'sec-fetch-dest': 'empty',
//             'referer': 'https://ani.gamer.com.tw/animeVideo.php?sn=39261',
//             'accept-encoding': 'gzip, deflate, br, zstd',
//             'accept-language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7',
//             'cookie': document.cookie // Include all cookies
//         },
//         body: data.toString()
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data.ok === 1) {
//                 console.log('Success:', data);
//             } else {
//                 console.error('Failed:', data);
//             }
//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });
// }