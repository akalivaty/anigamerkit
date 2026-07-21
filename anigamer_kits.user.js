// ==UserScript==
// @name         AniGamerKit
// @namespace    https://github.com/akalivaty/anigamerkit
// @version      1.2.0
// @description  Enhance your experience of anime journey with AniGamerKit!
// @author       yuva
// @match        https://ani.gamer.com.tw/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gamer.com.tw
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

window.addEventListener('load', () => {

    const DEFAULT_SETTINGS = {
        autoExpandMenu: true,
        showVideoPoster: true,
        enableFloatingVideo: true,
        enableCenteredDanmukuBox: true,
        enableSpeedControlShortcut: true,
        enableAutoInputPaymentInfo: true,
        enableSkipVideo: true,
        skipDuration: 89,
        phoneBarcode: "",
    };

    injectStyles();
    filterPage(DEFAULT_SETTINGS);
    createFloatingButton(DEFAULT_SETTINGS);
});
