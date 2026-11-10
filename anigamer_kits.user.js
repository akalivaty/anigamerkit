// ==UserScript==
// @name         AniGamerKit
// @namespace    https://github.com/akalivaty/anigamerkit
// @version      1.3.0
// @description  Enhance your experience of anime journey with AniGamerKit!
// @author       yuva
// @match        https://ani.gamer.com.tw/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gamer.com.tw
// @updateURL    https://github.com/akalivaty/anigamerkit/releases/latest/download/anigamer_kits.user.js
// @downloadURL  https://github.com/akalivaty/anigamerkit/releases/latest/download/anigamer_kits.user.js
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      bahamut.com.tw
// ==/UserScript==

onDomReady(() => {

    const DEFAULT_SETTINGS = {
        autoExpandMenu: true,
        showVideoPoster: true,
        enableFloatingVideo: true,
        floatingVideoWidthPercent: 30,
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
