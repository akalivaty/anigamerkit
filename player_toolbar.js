'use strict';

const PLAYER_TOOLBAR_WAIT_TIMEOUT = 30000;
const CONTINUOUS_PLAY_MODE_KEY = 'continuousPlayMode';
const EPISODE_SWITCH_PLAY_TIMEOUT = 30000;

/**
 * Decide what 自動播放下一集 / 馬拉松模式 should do with the player's end-of-episode overlays.
 * The site shows a "stop mask" when an episode ends: a 5 s countdown when its own autoplay is on,
 * a plain prompt when it is off, or an idle break ("畫面閒置過久") after 4 episodes / 80 minutes.
 * After 15 minutes of watching it shows the daily quiz (動漫通) instead, until it is closed.
 * @param {{ quizOpen: boolean, maskVisible: boolean, hasNextEpisode: boolean }} state
 * @returns {'skip-quiz'|'next'|'end'|null}
 **/
function getContinuousPlayAction({ quizOpen, maskVisible, hasNextEpisode }) {
    if (quizOpen) {
        return 'skip-quiz';
    }
    if (!maskVisible) {
        return null;
    }
    return hasNextEpisode ? 'next' : 'end';
}

/**
 * The episode to play after the current one in the episode list.
 * @param {string[]} episodeSns - The episode list in order
 * @param {string|null} currentSn
 * @param {boolean} loop - Wrap around to the first episode after the last one
 * @returns {string|null} null when there is no other episode to play
 **/
function getFollowingEpisodeSn(episodeSns, currentSn, loop) {
    if (episodeSns.length === 0) {
        return null;
    }
    const index = episodeSns.indexOf(currentSn);
    if (index >= 0 && index < episodeSns.length - 1) {
        return episodeSns[index + 1];
    }
    if (!loop) {
        return null;
    }
    return episodeSns[0] === currentSn ? null : episodeSns[0];
}

function getCurrentVideoSn() {
    return new URL(window.location.href).searchParams.get('sn');
}

function getEpisodeLinks() {
    return [...document.querySelectorAll('.season a[data-ani-video-sn]')];
}

/**
 * Switch episodes through the episode list. Unlike the end-of-episode "下一集" button this turns the
 * site's age gate back on, and the new episode waits for its 同意 button (hidden by the poster
 * feature's R18 style), so agree to it until the new episode starts playing.
 * @returns {boolean} Whether the episode was found in the list
 **/
function switchToEpisode(sn) {
    const link = getEpisodeLinks().find((episode) => episode.dataset.aniVideoSn === sn);
    if (!link) {
        return false;
    }
    link.click();

    const video = document.querySelector(EPISODE_POSTER_VIDEO_SELECTOR);
    const deadline = Date.now() + EPISODE_SWITCH_PLAY_TIMEOUT;
    const agreeUntilPlaying = () => {
        if (Date.now() > deadline || getCurrentVideoSn() !== sn || (video && !video.paused)) {
            return;
        }
        document.getElementById('adult')?.click();
        setTimeout(agreeUntilPlaying, 1000);
    };
    setTimeout(agreeUntilPlaying, 1000);
    return true;
}

/**
 * Play the episode after the current one, or with loop the first episode after the last one.
 * @returns {boolean} Whether another episode was started
 **/
function playFollowingEpisode(loop) {
    const currentSn = getCurrentVideoSn();
    const episodeSns = getEpisodeLinks().map((link) => link.dataset.aniVideoSn);
    const targetSn = getFollowingEpisodeSn(episodeSns, currentSn, loop);
    return targetSn !== null && switchToEpisode(targetSn);
}

/**
 * Add a row of AniGamerKit buttons between the player and the video title.
 * @param {Object} DEFAULT_SETTINGS
 **/
function initializePlayerToolbar(DEFAULT_SETTINGS) {
    waitForElement('.container-player > .anime-title', PLAYER_TOOLBAR_WAIT_TIMEOUT).then((animeTitle) => {
        if (!animeTitle || document.querySelector('.anigamerkit-player-toolbar')) {
            return;
        }

        const toolbar = document.createElement('section');
        toolbar.className = 'anigamerkit-player-toolbar';
        toolbar.setAttribute('aria-label', 'AniGamerKit');
        animeTitle.before(toolbar);

        toolbar.append(...createContinuousPlayButtons(DEFAULT_SETTINGS));
    });
}

function createToolbarToggle(label, icon, title) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'anigamerkit-toolbar-toggle';
    button.title = title;
    button.setAttribute('aria-pressed', 'false');

    const iconEl = document.createElement('i');
    iconEl.className = 'material-icons-round';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.textContent = icon;

    const text = document.createElement('span');
    text.textContent = label;

    button.append(iconEl, text);
    return button;
}

function setToolbarToggleState(button, pressed) {
    button.setAttribute('aria-pressed', String(pressed));
    button.classList.toggle('is-active', pressed);
}

const CONTINUOUS_PLAY_MODES = {
    autoplay: {
        label: '自動播放下一集',
        icon: 'skip_next',
        title: '播完直接播放下一集，略過倒數、閒置確認與動漫通問答（不作答）；最後一集播完後停止'
    },
    marathon: {
        label: '馬拉松模式',
        icon: 'all_inclusive',
        title: '同自動播放下一集，但最後一集播完後從第一集重新開始'
    }
};

/**
 * 自動播放下一集 and 馬拉松模式 share one setting, so at most one of them is on.
 * @returns {HTMLButtonElement[]}
 **/
function createContinuousPlayButtons(DEFAULT_SETTINGS) {
    let mode = GM_getValue(CONTINUOUS_PLAY_MODE_KEY, DEFAULT_SETTINGS[CONTINUOUS_PLAY_MODE_KEY]);
    if (!(mode in CONTINUOUS_PLAY_MODES)) {
        mode = 'off';
    }

    let watcher = null;
    const buttons = Object.entries(CONTINUOUS_PLAY_MODES).map(([buttonMode, { label, icon, title }]) => {
        const button = createToolbarToggle(label, icon, title);
        button.addEventListener('click', () => {
            const enabling = mode !== buttonMode;
            setMode(enabling ? buttonMode : 'off');
            showFloatingMessage(`已${enabling ? '開啟' : '關閉'}${label}`);
        });
        return [buttonMode, button];
    });

    function setMode(nextMode) {
        mode = nextMode;
        GM_setValue(CONTINUOUS_PLAY_MODE_KEY, mode);
        apply();
    }

    function apply() {
        buttons.forEach(([buttonMode, button]) => setToolbarToggleState(button, mode === buttonMode));
        watcher?.disconnect();
        watcher = mode === 'off' ? null : watchStopMask(() => mode);
    }

    apply();
    return buttons.map(([, button]) => button);
}

/**
 * The overlay the site shows and hides (via vjs-hidden) is the player's direct child
 * that contains the element, e.g. div.stop > div.replay > div.replay-col > #nextEpisode.
 * @returns {Element|null}
 **/
function getPlayerOverlay(player, element) {
    let current = element;
    while (current && current.parentElement !== player) {
        current = current.parentElement;
    }
    return current;
}

/**
 * Watch the player for the end-of-episode overlays and act on them.
 * The player element and its overlays are reused across in-page episode switches.
 * @param {Function} getMode - Returns the current mode: 'autoplay' or 'marathon'
 * @returns {{ disconnect: Function }}
 **/
function watchStopMask(getMode) {
    let observer = null;
    let disconnected = false;
    let scheduled = false;
    // The mask stays visible until the next episode starts playing, so act on it once per showing
    let handledMask = false;

    const check = (player) => {
        scheduled = false;
        if (disconnected) {
            return;
        }

        const nextEpisode = player.querySelector('#nextEpisode');
        const mask = getPlayerOverlay(player, nextEpisode);
        const quiz = player.querySelector('.video-cover-wrapper:not(.vjs-hidden) .anime-quiz')
            ?.closest('.video-cover-wrapper');
        const maskVisible = Boolean(mask && !mask.classList.contains('vjs-hidden'));
        if (!maskVisible) {
            handledMask = false;
        }

        const loop = getMode() === 'marathon';
        const label = CONTINUOUS_PLAY_MODES[getMode()]?.label ?? '';
        const action = getContinuousPlayAction({
            quizOpen: Boolean(quiz),
            maskVisible: maskVisible && !handledMask,
            hasNextEpisode: Boolean(nextEpisode && !nextEpisode.classList.contains('vjs-hidden'))
        });

        if (action === 'skip-quiz') {
            // The quiz's own close button submits answer 0 (a wrong answer). Remove it unanswered
            // instead (the 答 button can answer it later) and move on ourselves,
            // since the site only shows the end-of-episode mask after the quiz is closed.
            quiz.remove();
            showFloatingMessage(playFollowingEpisode(loop)
                ? `${label}：略過動漫通（未作答），播放下一集`
                : `${label}：略過動漫通（未作答）`);
        } else if (action === 'next') {
            handledMask = true;
            nextEpisode.click();
            showFloatingMessage(`${label}：播放下一集`);
        } else if (action === 'end') {
            handledMask = true;
            showFloatingMessage(loop && playFollowingEpisode(true)
                ? `${label}：已是最後一集，從第一集重新播放`
                : `${label}：已是最後一集`);
        }
    };

    waitForElement('.video-js', PLAYER_TOOLBAR_WAIT_TIMEOUT).then((player) => {
        if (!player || disconnected) {
            return;
        }
        observer = new MutationObserver(() => {
            if (!scheduled) {
                scheduled = true;
                queueMicrotask(() => check(player));
            }
        });
        observer.observe(player, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
        check(player);
    });

    return {
        disconnect() {
            disconnected = true;
            observer?.disconnect();
        }
    };
}
