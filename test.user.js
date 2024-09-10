'use strict';

let tip = "hi there!";

const current_url = window.location.href;
const regex_homePage = /https:\/\/ani\.gamer\.com\.tw\/$/gm;
const regex_video = /https:\/\/ani\.gamer\.com\.tw\/[a-zA-Z.?=]+[\d]+$/gm;
let danmukuBox;

function test_utils() {

    if (regex_homePage.test(current_url)) {
        console.log("here is homepage");
        triggerShowMoreButton();
    } else if (regex_video.test(current_url)) {
        console.log("here is video page, " + current_url);

        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', updateDanmukuBoxPosition);

        toggle_danmukuBox();

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
                danmukuBox.style.zIndex = '1000'; // Ensure it appears on top
                danmukuBox.style.padding = '10px';
                danmukuBox.style.fontSize = '16px';
                danmukuBox.style.width = '500px';
                danmukuBox.style.borderRadius = '8px';
                danmukuBox.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';

                // Add CSS for placeholder transparency
                const placeholderStyle = document.createElement('style');
                placeholderStyle.innerHTML = `
                    #custom-input-box::placeholder {
                        color: rgba(0, 0, 0, 0.5); /* 50% opacity */
                    }
                `;
                document.head.appendChild(placeholderStyle);
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

// Function to update danmukuBox position
function updateDanmukuBoxPosition() {
    getVideoRect();

    // reset danmukuBox position
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
        danmukuBox.style.transform = 'translate(-50%, -50%)'; // Center the box
    } else {
        console.error('Video element not found');
    }
}

function listenDanmuku(event) {
    // Listen for 'Enter' key press
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
    // 抓取輸入框和發送按鈕的元素
    const danmuInput = document.querySelector('#danmutxt');
    const sendButton = document.querySelector('.danmu-send_btn');
    danmuInput.value = danmuku;
    sendButton.click();
    console.log('Danmuku sent:', danmuku);
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