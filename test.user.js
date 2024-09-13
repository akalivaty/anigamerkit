'use strict';
const tip = "hi there!";

// Default settings
const defaultSettings = {
    autoExpandMenu: true,
    enableCenteredDanmukuBox: true,
};

// Initialize settings from storage or use default values
let autoExpandMenu = GM_getValue('autoExpandMenu', defaultSettings.autoExpandMenu);
let enableCenteredDanmukuBox = GM_getValue('enableCenteredDanmukuBox', defaultSettings.enableCenteredDanmukuBox);
let danmukuBox;

const URL_PATTERNS = {
    HOME_PAGE: /https:\/\/ani.gamer.com.tw\/$/gm,
    VIDEO_PAGE: /https:\/\/ani.gamer.com.tw\/[a-zA-Z.?=]+[\d]+$/gm,
    PARTY_PAGE: /https:\/\/ani.gamer.com.tw\/party[.=?\w]+$/gm
};

createFloatingButton();

function test_utils() {

    const current_url = window.location.href;

    if (URL_PATTERNS.HOME_PAGE.test(current_url)) {
        console.log("here is homepage");
        if (GM_getValue('autoExpandMenu', defaultSettings.autoExpandMenu)) {
            triggerShowMoreButton();
        }
    } else if (URL_PATTERNS.VIDEO_PAGE.test(current_url) || URL_PATTERNS.PARTY_PAGE.test(current_url)) {
        console.log("here is video page, " + current_url);

        if (GM_getValue('enableCenteredDanmukuBox', defaultSettings.enableCenteredDanmukuBox)) {
            // Listen for fullscreen changes
            document.addEventListener('fullscreenchange', updateDanmukuBoxPosition);

            toggle_danmukuBox();
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
    const danmuInput = document.querySelector('#danmutxt');
    const sendButton = document.querySelector('.danmu-send_btn');
    danmuInput.value = danmuku;
    sendButton.click();
    console.log('Danmuku sent:', danmuku);
}

function createFloatingButton() {
    const settingBtn = document.createElement('button');
    settingBtn.textContent = '+'; // Set the button content to '+'
    settingBtn.style.fontWeight = 'bold';
    settingBtn.style.position = 'fixed';
    settingBtn.style.bottom = '20px';
    settingBtn.style.right = '20px';
    settingBtn.style.width = '40px'; // Set width to make it square
    settingBtn.style.height = '40px'; // Set height to make it square
    settingBtn.style.padding = '0'; // Remove padding
    settingBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    settingBtn.style.color = 'rgba(64, 195, 221, 0.9)';
    settingBtn.style.border = 'none';
    settingBtn.style.borderRadius = '50%'; // Make it circular
    settingBtn.style.cursor = 'pointer';
    settingBtn.style.zIndex = '1001';
    settingBtn.style.fontSize = '24px'; // Increase font size for better visibility
    settingBtn.style.display = 'flex';
    settingBtn.style.alignItems = 'center';
    settingBtn.style.justifyContent = 'center';

    settingBtn.onclick = toggleSettingsPanel; // Toggle settings panel on click

    document.body.appendChild(settingBtn);
}

function toggleSettingsPanel() {
    let showingPanel = document.getElementById('settings-panel');
    if (showingPanel) {
        showingPanel.remove();
    } else {
        createSettingsPanel();
    }
}

function createSettingsPanel() {
    const settingPanel = document.createElement('div');
    settingPanel.id = 'settings-panel';
    settingPanel.style.position = 'fixed';
    settingPanel.style.right = '20px';
    settingPanel.style.bottom = '60px';
    settingPanel.style.width = '30%';
    settingPanel.style.height = '30%';
    settingPanel.style.padding = '20px';
    settingPanel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    settingPanel.style.border = '1px solid #ccc';
    settingPanel.style.borderRadius = '8px';
    settingPanel.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    settingPanel.style.zIndex = '1001';
    settingPanel.style.fontSize = '14px';

    const title = document.createElement('h3');
    title.textContent = 'Settings';
    title.style.fontWeight = 'bold';
    title.style.textAlign = 'center';
    title.style.fontSize = '20px';
    settingPanel.appendChild(title);

    // Container for options
    const option_container = document.createElement('div');
    option_container.style.display = 'flex';
    option_container.style.flexDirection = 'column';
    option_container.style.marginTop = '10px';

    // Option to enable/disable auto expand menu
    const container_AEM = document.createElement('div');
    container_AEM.style.display = 'flex';
    container_AEM.style.alignItems = 'center';
    container_AEM.style.marginBottom = '10px';

    const checkBox_AEM = document.createElement('input');
    checkBox_AEM.type = 'checkbox';
    checkBox_AEM.checked = autoExpandMenu;
    checkBox_AEM.style.width = '20px';
    checkBox_AEM.style.height = '20px';

    const label_AEM = document.createElement('label');
    label_AEM.textContent = 'Enable Auto Expand Menu';
    label_AEM.style.fontSize = '16px';
    label_AEM.style.marginLeft = '5px';

    container_AEM.appendChild(checkBox_AEM);
    container_AEM.appendChild(label_AEM);

    // Option to enable/disable centered danmuku box
    const container_CDB = document.createElement('div');
    container_CDB.style.display = 'flex';
    container_CDB.style.alignItems = 'center';

    const checkBox_CDB = document.createElement('input');
    checkBox_CDB.type = 'checkbox';
    checkBox_CDB.checked = enableCenteredDanmukuBox;
    checkBox_CDB.style.width = '20px';
    checkBox_CDB.style.height = '20px';

    const label_CDB = document.createElement('label');
    label_CDB.textContent = 'Enable Centered Danmuku Box';
    label_CDB.style.fontSize = '16px';
    label_CDB.style.marginLeft = '5px';

    container_CDB.appendChild(checkBox_CDB);
    container_CDB.appendChild(label_CDB);

    option_container.appendChild(container_AEM);
    option_container.appendChild(container_CDB);

    settingPanel.appendChild(option_container);

    // Apply button
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply';
    applyBtn.style.position = 'absolute';
    applyBtn.style.left = '50%';
    applyBtn.style.bottom = '10px';
    applyBtn.style.transform = 'translateX(-50%)';
    applyBtn.style.padding = '10px 20px';
    applyBtn.style.backgroundColor = 'rgba(64, 195, 221, 0.9)';
    applyBtn.style.color = 'white';
    applyBtn.style.border = 'none';
    applyBtn.style.borderRadius = '5px';
    applyBtn.style.cursor = 'pointer';

    applyBtn.onclick = () => {
        autoExpandMenu = checkBox_AEM.checked;
        GM_setValue('autoExpandMenu', autoExpandMenu);
        enableCenteredDanmukuBox = checkBox_CDB.checked;
        GM_setValue('enableInputBox', enableCenteredDanmukuBox);

        showFloatingMessage('Settings have been applied.');
    };

    settingPanel.appendChild(applyBtn);

    document.body.appendChild(settingPanel);
}

function showFloatingMessage(message) {
    const msg = document.createElement('div');
    msg.textContent = message;
    msg.style.position = 'fixed';
    msg.style.top = '20px';
    msg.style.left = '50%';
    msg.style.transform = 'translateX(-50%)';
    msg.style.fontSize = '24px'; // Increased font size
    msg.style.fontWeight = 'bold'; // Make text bold
    msg.style.padding = '20px';
    msg.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    msg.style.color = 'white';
    msg.style.borderRadius = '10px';
    msg.style.zIndex = '1001';
    msg.style.opacity = '0'; // Start with full transparency
    msg.style.transition = 'opacity 0.3s'; // Set transition for fade effects


    document.body.appendChild(msg);

    // Trigger the fade-in effect
    setTimeout(() => {
        msg.style.opacity = '1'; // Fade in
    }, 10); // Small delay to ensure the initial opacity style is applied

    // Trigger the fade-out effect after 2 seconds (2000 ms)
    setTimeout(() => {
        msg.style.opacity = '0'; // Fade out
    }, 2000);

    // Remove the message from the DOM after the fade-out completes
    setTimeout(() => {
        if (msg && msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    }, 3000); // Total duration (fade-in + visible + fade-out)
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