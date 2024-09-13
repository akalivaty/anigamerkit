// ==UserScript==
// @name         AniGamerKit
// @namespace    anigamerkit
// @version      0.1
// @description  huh
// @author       yuva
// @match        https://ani.gamer.com.tw/*
// @require      file://C:/Users/wnec_yuva/dev/userscripts/anigamer_kits/settings.js
// @require      file://C:/Users/wnec_yuva/dev/userscripts/anigamer_kits/danmuku.js
// @require      file://C:/Users/wnec_yuva/dev/userscripts/anigamer_kits/utils.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gamer.com.tw
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

window.onload = function () {
    // Default settings
    const DEFAULT_SETTINGS = {
        autoExpandMenu: true,
        enableCenteredDanmukuBox: true,
    };

    const URL_PATTERNS = {
        HOME_PAGE: /https:\/\/ani.gamer.com.tw\/$/gm,
        VIDEO_PAGE: /https:\/\/ani.gamer.com.tw\/[a-zA-Z.?=]+[\d]+$/gm,
        PARTY_PAGE: /https:\/\/ani.gamer.com.tw\/party[.=?\w]+$/gm
    };

    injectStyles();
    createFloatingButton(DEFAULT_SETTINGS);
    filterPage(URL_PATTERNS, DEFAULT_SETTINGS);
}
