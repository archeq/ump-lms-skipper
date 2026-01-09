(function() {
    'use strict';

    // =================================================================
    // CONFIGURATION (Based on old.js + improvements)
    // =================================================================

    const TARGET_TEXTS = ["NASTĘPNY", "DALEJ", "NEXT"];
    const POLLING_INTERVAL = 2000; // Check every 2s (same as old.js)
    const PLAYBACK_SPEED = 1.0;
    const COOLDOWN_TIME = 3000; // Prevent double-clicks

    // iSpring specific selectors (for timer-based logic)
    const ISPRING_TIME_SELECTOR = '.label.time';
    const ISPRING_NEXT_SELECTOR = '.component_container.next';

    // Classic/Iframe specific selectors
    const CLASSIC_BUTTONS = [
        '#next', '#linkNext',
        'button[aria-label="Next"]', 'button[aria-label="Dalej"]',
        'div.next-button', '.cs-next'
    ];

    console.log('[UMP] Script loaded and running');

    // =================================================================
    // HELPER: ENSURE VIDEO PLAYS (Exact copy from old.js)
    // =================================================================

    function ensureMediaPlaying() {
        const mediaElements = document.querySelectorAll('video, audio');
        mediaElements.forEach(media => {
            // 1. Unmute for sound (changed from old.js)
            if (media.muted) media.muted = false;

            // 2. Ensure it is actually running
            if (media.paused && media.readyState > 2) {
                media.play().catch(e => {
                    // If autoplay fails, try with mute
                    if (!media.muted) {
                        media.muted = true;
                        media.play().catch(() => {});
                    }
                });
            }

            // 3. Set Speed
            if (media.playbackRate !== PLAYBACK_SPEED) {
                media.playbackRate = PLAYBACK_SPEED;
            }
        });
    }

    // =================================================================
    // HELPER: SAFE CLICKER (Based on old.js)
    // =================================================================

    let lastClickTime = 0; // Prevent double-clicks

    function triggerClick(element) {
        const now = Date.now();
        if (now - lastClickTime < COOLDOWN_TIME) {
            console.log("[UMP] Cooldown active, skipping click");
            return;
        }

        console.log("[UMP] Unlocked! Clicking:", element);
        lastClickTime = now;

        // Visual Feedback (Green Flash) - same as old.js
        element.style.border = "5px solid #00ff00";

        // 1. Dispatch Events (The most reliable way for iSpring)
        const events = ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'];

        events.forEach(type => {
            const evt = new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(evt);
        });

        // 2. Find the specific HTML button inside and click it
        const actualBtn = element.querySelector('button');
        if (actualBtn) {
            actualBtn.click();
        }
    }

    // =================================================================
    // HELPER: Parse time "MM:SS" to seconds
    // =================================================================

    function parseSeconds(timeStr) {
        if (!timeStr) return 0;
        timeStr = timeStr.trim();
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return (parts[0] * 60) + parts[1];
        if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        return 0;
    }

    // =================================================================
    // MAIN SEARCH LOGIC (Improved version of old.js)
    // =================================================================

    function scanAndWait() {
        // 1. Keep video running (same as old.js)
        ensureMediaPlaying();

        // 2. Find the container
        let target = null;

        // Priority A: iSpring specific selector
        const directMatch = document.querySelector(ISPRING_NEXT_SELECTOR);
        if (directMatch && directMatch.offsetParent !== null) {
            target = directMatch;
        }

        // Priority B: Classic player selectors
        if (!target) {
            for (let selector of CLASSIC_BUTTONS) {
                const el = document.querySelector(selector);
                if (el && el.offsetParent !== null) {
                    target = el;
                    break;
                }
            }
        }

        // Priority C: Text Search (Fallback - same as old.js)
        if (!target) {
            const allDivs = document.querySelectorAll('div, button, span');
            for (let el of allDivs) {
                if (el.innerText && TARGET_TEXTS.includes(el.innerText.trim().toUpperCase())) {
                    if (el.offsetParent !== null && el.tagName !== 'SCRIPT') {
                        let parent = el;
                        while (parent && !parent.classList.contains('component_container') && parent !== document.body) {
                            parent = parent.parentElement;
                        }
                        target = (parent && parent !== document.body) ? parent : el;
                        break;
                    }
                }
            }
        }

        // 3. Check Status & Execute
        if (target) {
            // Check for iSpring timer logic
            const timeLabel = document.querySelector(ISPRING_TIME_SELECTOR);
            if (timeLabel && target.classList.contains('next')) {
                // iSpring player - check timer
                const text = timeLabel.innerText || "";
                const times = text.split('/');

                if (times.length === 2) {
                    const currentSec = parseSeconds(times[0]);
                    const totalSec = parseSeconds(times[1]);
                    const isFinished = currentSec >= (totalSec - 1);

                    if (isFinished) {
                        // UNLOCKED by timer: Check cooldown BEFORE clicking
                        const now = Date.now();
                        if (now - lastClickTime >= COOLDOWN_TIME) {
                            // Green border + click
                            target.style.border = "5px solid #00ff00";
                            console.log("[UMP] iSpring timer done! Clicking:", target);
                            lastClickTime = now;

                            // Dispatch Events
                            const events = ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'];
                            events.forEach(type => {
                                const evt = new MouseEvent(type, {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                target.dispatchEvent(evt);
                            });

                            // Find button inside and click
                            const actualBtn = target.querySelector('button');
                            if (actualBtn) {
                                actualBtn.click();
                            }
                        } else {
                            // Cooldown active - show green but don't click
                            target.style.border = "5px solid #00ff00";
                        }
                    } else {
                        // LOCKED by timer: Wait (Yellow border)
                        target.style.border = "5px solid #FFFF00";
                    }
                }
            } else {
                // Classic/iframe player - check disabled state (same as old.js)
                const isLocked = target.classList.contains('disabled') ||
                                 target.classList.contains('blocked') ||
                                 target.classList.contains('cs-disabled') ||
                                 target.classList.contains('btn-disabled') ||
                                 target.getAttribute('aria-disabled') === 'true';

                if (isLocked) {
                    // LOCKED: Wait (Yellow border)
                    target.style.border = "5px solid #FFFF00";
                } else {
                    // UNLOCKED: Click
                    triggerClick(target);
                }
            }
        }
    }

    // =================================================================
    // INIT (Same as old.js)
    // =================================================================

    setInterval(scanAndWait, POLLING_INTERVAL);

})();

