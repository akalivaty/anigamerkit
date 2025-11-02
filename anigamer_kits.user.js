// ==UserScript==
// @name         AniGamerKit
// @namespace    https://github.com/akalivaty/anigamerkit
// @version      1.0.0
// @description  Enhance your experience of anime journey with AniGamerKit!
// @author       yuva
// @match        https://ani.gamer.com.tw/*
// @require      file:///Users/yuva/dev/web_extensions/anigamerkit/danmuku.js
// @require      file:///Users/yuva/dev/web_extensions/anigamerkit/user_settings.js
// @require      file:///Users/yuva/dev/web_extensions/anigamerkit/utils.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gamer.com.tw
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

window.onload = function () {

    const DEFAULT_SETTINGS = {
        autoExpandMenu: true,
        showVideoPoster: true,
        enableCenteredDanmukuBox: true,
        enableSpeedControlShortcut: true,
        enableAutoInputPaymentInfo: true,
        enableSkipVideo: true,
        skipDuration: 89,
        phoneBarcode: "",
    };

    const URL_PATTERNS = {
        HOME_PAGE: /https:\/\/ani\.gamer\.com\.tw\/$/gm,
        VIDEO_PAGE: /https:\/\/ani\.gamer\.com\.tw\/animeVideo\.php\?sn=\d+$/gm,
        PARTY_PAGE: /https:\/\/ani\.gamer\.com\.tw\/party[.=?\w]+$/gm,
        PAYMENT_PAGE: /https:\/\/ani.gamer.com.tw\/animePay2\.php\?itemSn=\d+$/gm
    };

    injectStyles();
    filterPage(URL_PATTERNS, DEFAULT_SETTINGS);
    createFloatingButton(DEFAULT_SETTINGS);
}
