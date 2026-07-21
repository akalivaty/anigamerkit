'use strict';

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
            width: 420px;
            height: 236.25px;
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
            z-index: 2147483646 !important;
        }

        .anigamerkit-floating-resize-handle {
            position: absolute;
            box-sizing: border-box;
            z-index: 2147483647;
            touch-action: none;
            user-select: none;
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
        // If homepage
        console.log("here is homepage");

        if (GM_getValue('autoExpandMenu', DEFAULT_SETTINGS.autoExpandMenu)) {
            triggerShowMoreButton();
        }
    } else if (pageType === 'video') {
        // If video page
        console.log("here is video page, " + currentUrl.href);

        if (GM_getValue('showVideoPoster', DEFAULT_SETTINGS.showVideoPoster)) {
            showVideoPoster();
        }

        if (GM_getValue('enableFloatingVideo', DEFAULT_SETTINGS.enableFloatingVideo)) {
            initializeFloatingVideo();
        }

        if (GM_getValue('enableCenteredDanmukuBox', DEFAULT_SETTINGS.enableCenteredDanmukuBox)) {
            document.addEventListener('fullscreenchange', updateDanmukuBoxPosition);
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
        // If payment page
        console.log("here is payment page, " + currentUrl.href);

        if (GM_getValue('enableAutoInputPaymentInfo', DEFAULT_SETTINGS.enableAutoInputPaymentInfo)) {
            const phoneBarcode = GM_getValue('phoneBarcode', null);
            autoInputPaymentInfo(phoneBarcode);
        }

    } else {
        console.log(`failed at ${currentUrl.href}`);
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
    const showMoreBtn = document.querySelector('.btn-show-more');
    if (showMoreBtn) {
        showMoreBtn.click();
    } else {
        console.error('Button with class "btn-show-more" not found.');
    }
}

function showVideoPoster() {
    // Hide R18 divs
    const r18DivObserver = new MutationObserver(() => {
        document.querySelectorAll('.R18').forEach(el => el.style.display = 'none');
    });
    r18DivObserver.observe(document.body, { childList: true, subtree: true });

    // Auto agree to adult check
    const video = document.querySelector('video');
    if (video) {
        video.addEventListener('click', function (event) {
            if (event.button === 0) {
                const agreeBtn = document.getElementById('adult');
                if (agreeBtn) agreeBtn.click();
            }
        });
    }
}

function modifySpeed(event) {
    if (!event.shiftKey || (event.key !== '>' && event.key !== '<')) {
        return;
    }

    const video = document.querySelector('video');
    if (!video) {
        return;
    }

    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    let currentSpeedIndex = speeds.indexOf(video.playbackRate);

    if (event.shiftKey && event.key === '>') {
        // speed up
        if (currentSpeedIndex < speeds.length - 1) {
            currentSpeedIndex++;
            video.playbackRate = speeds[currentSpeedIndex];
            showFloatingMessage(video.playbackRate + "X", 500, 'video-bottom-right');
        }
    } else if (event.shiftKey && event.key === '<') {
        // speed down
        if (currentSpeedIndex > 0) {
            currentSpeedIndex--;
            video.playbackRate = speeds[currentSpeedIndex];
            showFloatingMessage(video.playbackRate + "X", 500, 'video-bottom-right');
        }
    }
}

function skipVideo(event, duration) {
    if (event.key !== '1') {
        return;
    }

    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
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
            const phoneBarcodeInput = document.querySelector('input[name="cell-cardno"]');
            if (phoneBarcodeInput && phoneBarcode) {
                phoneBarcodeInput.value = phoneBarcode;
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
    msg.style.zIndex = '1001';
    msg.style.opacity = '0';
    msg.style.transition = 'opacity 0.3s';

    document.documentElement.appendChild(msg);

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
                console.log('msg.offsetHeight: ', msg.offsetHeight);
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
