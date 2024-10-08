// ==UserScript==
// @name         AniGamerKit
// @namespace    https://github.com/akalivaty/anigamerkit
// @version      0.3
// @description  Enhance your experience of anime journey with AniGamerKit!
// @author       yuva
// @match        https://ani.gamer.com.tw/*
// @require      https://raw.githubusercontent.com/akalivaty/anigamerkit/main/danmuku.js
// @require      https://raw.githubusercontent.com/akalivaty/anigamerkit/main/user_settings.js
// @require      https://raw.githubusercontent.com/akalivaty/anigamerkit/main/utils.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gamer.com.tw
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

window.onload = function () {

    const DEFAULT_SETTINGS = {
        autoExpandMenu: true,
        enableCenteredDanmukuBox: true,
        enableSpeedControlShortcut: true,
        enableAutoInputPaymentInfo: true,
        phoneBarcode: "",
    };

    const URL_PATTERNS = {
        HOME_PAGE: /https:\/\/ani\.gamer\.com\.tw\/$/gm,
        VIDEO_PAGE: /https:\/\/ani\.gamer\.com\.tw\/animeVideo\.php\?sn=\d+$/gm,
        PARTY_PAGE: /https:\/\/ani\.gamer\.com\.tw\/party[.=?\w]+$/gm,
        PAYMENT_PAGE: /https:\/\/ani.gamer.com.tw\/animePay2\.php\?itemSn=\d+$/gm
    };

    injectStyles();
    createFloatingButton(DEFAULT_SETTINGS);
    filterPage(URL_PATTERNS, DEFAULT_SETTINGS);
}
