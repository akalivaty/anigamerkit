'use strict';

const FLOATING_VIDEO_ENTER_THRESHOLD = 0.5;
const FLOATING_VIDEO_EXIT_THRESHOLD = 0.6;
const FLOATING_VIDEO_MAX_WIDTH = 420;
const FLOATING_VIDEO_MIN_WIDTH = 240;
const FLOATING_VIDEO_MIN_HEIGHT = 135;
const FLOATING_VIDEO_VIEWPORT_GAP = 16;
const FLOATING_VIDEO_BOTTOM_GAP = 72;
const FLOATING_VIDEO_DRAG_THRESHOLD = 5;
const FLOATING_VIDEO_INTERACTIVE_SELECTOR = [
    'button',
    'a',
    'input',
    'textarea',
    'select',
    'label',
    '[role="button"]',
    '[contenteditable="true"]',
    '.vjs-control',
    '.vjs-control-bar',
    '.anigamerkit-floating-resize-handle'
].join(', ');

function getVisibleHeightRatio(entry) {
    const visibleHeight = entry.intersectionRect?.height || 0;
    const totalHeight = entry.boundingClientRect?.height || 0;
    if (totalHeight <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(1, visibleHeight / totalHeight));
}

function shouldFloatVideo(isFloating, visibleRatio, isPlaying, isFullscreen) {
    if (isFullscreen) {
        return false;
    }
    if (isFloating) {
        return visibleRatio < FLOATING_VIDEO_EXIT_THRESHOLD;
    }
    return isPlaying && visibleRatio < FLOATING_VIDEO_ENTER_THRESHOLD;
}

function clampFloatingValue(value, min, max) {
    return Math.min(Math.max(value, min), Math.max(min, max));
}

function getDraggedFloatingRect(rect, deltaX, deltaY, viewportWidth, viewportHeight) {
    const width = Math.min(rect.width, viewportWidth);
    const height = Math.min(rect.height, viewportHeight);
    return {
        left: clampFloatingValue(rect.left + deltaX, 0, viewportWidth - width),
        top: clampFloatingValue(rect.top + deltaY, 0, viewportHeight - height),
        width,
        height
    };
}

function getInitialFloatingSize(rememberedSize, aspectRatio, viewportWidth, viewportHeight) {
    const availableWidth = Math.max(0, viewportWidth - FLOATING_VIDEO_VIEWPORT_GAP * 2);
    const availableHeight = Math.max(
        0,
        viewportHeight - FLOATING_VIDEO_BOTTOM_GAP - FLOATING_VIDEO_VIEWPORT_GAP
    );
    const defaultWidth = Math.min(FLOATING_VIDEO_MAX_WIDTH, availableWidth);
    return {
        width: Math.min(rememberedSize?.width ?? defaultWidth, availableWidth),
        height: Math.min(rememberedSize?.height ?? defaultWidth / aspectRatio, availableHeight)
    };
}

function getResizedFloatingRect(rect, deltaX, deltaY, direction, viewportWidth, viewportHeight) {
    const minWidth = Math.min(FLOATING_VIDEO_MIN_WIDTH, viewportWidth);
    const minHeight = Math.min(FLOATING_VIDEO_MIN_HEIGHT, viewportHeight);
    let { left, top, width, height } = rect;

    if (direction.includes('e')) {
        width = clampFloatingValue(rect.width + deltaX, minWidth, viewportWidth - rect.left);
    } else if (direction.includes('w')) {
        const right = rect.left + rect.width;
        width = clampFloatingValue(rect.width - deltaX, minWidth, right);
        left = right - width;
    }

    if (direction.includes('s')) {
        height = clampFloatingValue(rect.height + deltaY, minHeight, viewportHeight - rect.top);
    } else if (direction.includes('n')) {
        const bottom = rect.top + rect.height;
        height = clampFloatingValue(rect.height - deltaY, minHeight, bottom);
        top = bottom - height;
    }

    return { left, top, width, height };
}

function isFloatingVideoInteractiveTarget(target) {
    return Boolean(target?.closest?.(FLOATING_VIDEO_INTERACTIVE_SELECTOR));
}

function initializeFloatingVideo() {
    if (typeof IntersectionObserver !== 'function') {
        return;
    }

    let playerElement = null;
    let videoElement = null;
    let placeholder = null;
    let observer = null;
    let isFloating = false;
    let lastVisibleRatio = 1;
    let playerAspectRatio = 16 / 9;
    let originalPlayerLayoutStyles = null;
    let interactionControls = [];
    let rememberedFloatingSize = null;

    const isVideoPlaying = () => Boolean(
        videoElement
        && !videoElement.paused
        && !videoElement.ended
        && videoElement.readyState >= 2
    );

    const updateDanmukuPosition = () => {
        if (typeof updateDanmukuBoxPosition === 'function') {
            updateDanmukuBoxPosition();
        }
    };

    const applyFloatingRect = (rect) => {
        if (!playerElement) {
            return;
        }
        for (const property of ['left', 'top', 'width', 'height']) {
            playerElement.style.setProperty(property, `${rect[property]}px`, 'important');
        }
    };

    const updateFloatingSize = () => {
        if (!isFloating || !playerElement) {
            return;
        }
        const { width, height } = getInitialFloatingSize(
            rememberedFloatingSize,
            playerAspectRatio,
            window.innerWidth,
            window.innerHeight
        );
        applyFloatingRect({
            left: Math.max(0, window.innerWidth - width - FLOATING_VIDEO_VIEWPORT_GAP),
            top: Math.max(0, window.innerHeight - height - FLOATING_VIDEO_BOTTOM_GAP),
            width,
            height
        });
        updateDanmukuPosition();
    };

    const startPointerInteraction = (event, mode, direction = '') => {
        if (!isFloating || !playerElement || event.button !== 0) {
            return;
        }
        const requiresDragThreshold = mode === 'move';
        let isActivated = !requiresDragThreshold;
        if (isActivated) {
            event.preventDefault();
            event.stopPropagation();
        }

        const startRect = playerElement.getBoundingClientRect();
        const pointerId = event.pointerId;
        const startX = event.clientX;
        const startY = event.clientY;

        const handlePointerMove = (moveEvent) => {
            if (moveEvent.pointerId !== pointerId) {
                return;
            }
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            if (!isActivated) {
                if (Math.hypot(deltaX, deltaY) < FLOATING_VIDEO_DRAG_THRESHOLD) {
                    return;
                }
                isActivated = true;
                playerElement.classList.add('is-dragging');
            }
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
            const nextRect = mode === 'move'
                ? getDraggedFloatingRect(startRect, deltaX, deltaY, window.innerWidth, window.innerHeight)
                : getResizedFloatingRect(
                    startRect,
                    deltaX,
                    deltaY,
                    direction,
                    window.innerWidth,
                    window.innerHeight
                );
            applyFloatingRect(nextRect);
        };

        const finishPointerInteraction = (finishEvent) => {
            if (finishEvent.pointerId !== pointerId) {
                return;
            }
            window.removeEventListener('pointermove', handlePointerMove, true);
            window.removeEventListener('pointerup', finishPointerInteraction, true);
            window.removeEventListener('pointercancel', finishPointerInteraction, true);
            playerElement.classList.remove('is-dragging');

            if (isActivated) {
                finishEvent.preventDefault();
                finishEvent.stopPropagation();
                if (finishEvent.type === 'pointerup') {
                    playerElement.addEventListener('click', (clickEvent) => {
                        clickEvent.preventDefault();
                        clickEvent.stopPropagation();
                    }, { capture: true, once: true });
                }
                if (mode === 'resize') {
                    const resizedRect = playerElement.getBoundingClientRect();
                    rememberedFloatingSize = {
                        width: resizedRect.width,
                        height: resizedRect.height
                    };
                }
                updateDanmukuPosition();
            }
        };

        window.addEventListener('pointermove', handlePointerMove, true);
        window.addEventListener('pointerup', finishPointerInteraction, true);
        window.addEventListener('pointercancel', finishPointerInteraction, true);
    };

    const addInteractionControls = () => {
        if (!playerElement) {
            return;
        }

        for (const direction of ['nw', 'ne', 'sw', 'se']) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = `anigamerkit-floating-resize-handle is-${direction}`;
            resizeHandle.title = '調整浮動播放器大小';
            resizeHandle.addEventListener('pointerdown', (event) => {
                startPointerInteraction(event, 'resize', direction);
            });
            playerElement.appendChild(resizeHandle);
            interactionControls.push(resizeHandle);
        }
    };

    const exitFloatingMode = () => {
        if (!isFloating || !playerElement) {
            return;
        }

        isFloating = false;
        if (placeholder && observer) {
            observer.unobserve(placeholder);
        }
        interactionControls.forEach((control) => control.remove());
        interactionControls = [];
        playerElement.classList.remove('anigamerkit-floating-video');
        for (const property of ['left', 'top', 'right', 'bottom', 'width', 'height']) {
            const original = originalPlayerLayoutStyles?.[property];
            if (original?.value) {
                playerElement.style.setProperty(property, original.value, original.priority);
            } else {
                playerElement.style.removeProperty(property);
            }
        }
        originalPlayerLayoutStyles = null;
        placeholder?.remove();
        placeholder = null;

        if (observer && playerElement.isConnected) {
            observer.observe(playerElement);
        }
        updateDanmukuPosition();
    };

    const enterFloatingMode = () => {
        if (isFloating || !playerElement || !playerElement.parentNode || !observer) {
            return;
        }

        const playerRect = playerElement.getBoundingClientRect();
        if (playerRect.width <= 0 || playerRect.height <= 0) {
            return;
        }
        playerAspectRatio = playerRect.width / playerRect.height;
        originalPlayerLayoutStyles = Object.fromEntries(
            ['left', 'top', 'right', 'bottom', 'width', 'height'].map((property) => [property, {
                value: playerElement.style.getPropertyValue(property),
                priority: playerElement.style.getPropertyPriority(property)
            }])
        );

        placeholder = document.createElement('div');
        placeholder.className = 'anigamerkit-video-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.style.width = `${playerRect.width}px`;
        placeholder.style.maxWidth = '100%';
        placeholder.style.height = `${playerRect.height}px`;
        playerElement.parentNode.insertBefore(placeholder, playerElement);

        observer.unobserve(playerElement);
        observer.observe(placeholder);
        isFloating = true;
        playerElement.classList.add('anigamerkit-floating-video');
        updateFloatingSize();
        addInteractionControls();
    };

    const updateFloatingState = (visibleRatio) => {
        const nextFloatingState = shouldFloatVideo(
            isFloating,
            visibleRatio,
            isVideoPlaying(),
            Boolean(document.fullscreenElement)
        );

        if (nextFloatingState && !isFloating) {
            enterFloatingMode();
        } else if (!nextFloatingState && isFloating) {
            exitFloatingMode();
        }
    };

    const attachToPlayer = () => {
        if (playerElement?.isConnected && videoElement?.isConnected) {
            return true;
        }

        const nextPlayer = document.querySelector('.videoframe');
        const nextVideo = nextPlayer?.querySelector('video')
            || document.querySelector('#ani_video_html5_api, video.vjs-tech, video');
        if (!nextPlayer || !nextVideo) {
            return false;
        }

        playerElement = nextPlayer;
        videoElement = nextVideo;
        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                lastVisibleRatio = getVisibleHeightRatio(entry);
                updateFloatingState(lastVisibleRatio);
            });
        }, {
            root: null,
            rootMargin: '-60px 0px -8px 0px',
            threshold: [0, FLOATING_VIDEO_ENTER_THRESHOLD, FLOATING_VIDEO_EXIT_THRESHOLD, 1]
        });
        observer.observe(playerElement);

        videoElement.addEventListener('play', () => updateFloatingState(lastVisibleRatio));
        playerElement.addEventListener('pointerdown', (event) => {
            if (isFloating && !isFloatingVideoInteractiveTarget(event.target)) {
                startPointerInteraction(event, 'move');
            }
        }, { capture: true });
        document.addEventListener('fullscreenchange', () => updateFloatingState(lastVisibleRatio));
        window.addEventListener('resize', () => {
            if (!isFloating || !playerElement) {
                return;
            }
            const rect = playerElement.getBoundingClientRect();
            applyFloatingRect(getDraggedFloatingRect(
                rect,
                0,
                0,
                window.innerWidth,
                window.innerHeight
            ));
        });
        if (typeof ResizeObserver === 'function') {
            const resizeObserver = new ResizeObserver(() => {
                if (isFloating) {
                    updateDanmukuPosition();
                }
            });
            resizeObserver.observe(playerElement);
        }
        return true;
    };

    if (!attachToPlayer() && typeof MutationObserver === 'function') {
        const discoveryObserver = new MutationObserver(() => {
            if (attachToPlayer()) {
                discoveryObserver.disconnect();
            }
        });
        discoveryObserver.observe(document.body, { childList: true, subtree: true });
    }
}
