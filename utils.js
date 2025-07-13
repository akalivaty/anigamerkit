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

/**
 * Filter the page based on URL patterns and apply settings.
 * @param {Object} URL_PATTERNS - An object containing regex patterns for different pages
 * @param {Object} DEFAULT_SETTINGS - An object containing user's settings for the script
 * @returns {void}
 **/
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
        }

        if (GM_getValue('enableSpeedControlShortcut', DEFAULT_SETTINGS.enableSpeedControlShortcut)) {
            document.addEventListener('keydown', modifySpeed);
        }

        if (GM_getValue('enableSkip', DEFAULT_SETTINGS.enableSkipVideo)) {
            const skipDuration = GM_getValue('skipDuration', DEFAULT_SETTINGS.skipDuration);
            document.addEventListener('keydown', (event) => skipVideo(event, skipDuration));

        }

    } else if (URL_PATTERNS.PAYMENT_PAGE.test(current_url)) {
        // If payment page
        console.log("here is video page, " + current_url);

        if (GM_getValue('enableAutoInputPaymentInfo', DEFAULT_SETTINGS.enableAutoInputPaymentInfo)) {
            const phoneBarcode = GM_getValue('phoneBarcode', null);
            autoInputPaymentInfo(phoneBarcode);
        }

    } else {
        console.log(`failed at ${current_url}`);
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
    const video = document.querySelector('video');

    if (video.duration > 10) {
        if (event.ctrlKey && event.key === 'F2') {
            video.currentTime += duration;
        }
    }
    else {
        return;
    }
}

function autoInputPaymentInfo(phoneBarcode = null) {

    const invoiceChoice = document.querySelector('.payment-form-invoice');
    if (invoiceChoice) {
        const noDonateInvoice = document.querySelector('#e2');
        noDonateInvoice.click();
        const invoiceTypeSelect = document.querySelector('select.anime-select--invoice');
        if (invoiceTypeSelect) {
            invoiceTypeSelect.value = '3';
            invoiceTypeSelect.dispatchEvent(new Event('change'));
            const phoneBarcodeInput = document.querySelector('input[name="cell-cardno"]');
            if (phoneBarcodeInput && phoneBarcode) {
                phoneBarcodeInput.value = phoneBarcode;
            }
        }
    }

    // auto check all checkboxes
    const checkBoxList = document.querySelectorAll('input.checkBtns');
    checkBoxList.forEach(checkbox => {
        checkbox.click();
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