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
    // HELPER: ENSURE VIDEO PLAYS (Improved with visibility check for audio chaos)
    // =================================================================

    function ensureMediaPlaying() {
        const mediaElements = document.querySelectorAll('video, audio');
        mediaElements.forEach(media => {
            // 0. VISIBILITY & RELEVANCE CHECK (Fixes "All audio playing at once")
            // We only want to play media that is visibly part of the current slide
            // or at least not explicitly hidden.
            if (media.offsetParent === null && media.tagName !== 'AUDIO') {
                // Video hidden? Skip.
                return;
            }

            // For audio/video on iSpring/iframe, sometimes many exist but only one is active.
            // Often active ones have specific classes or are within the active slide container.
            // A simple heuristic: check if it has height/width OR if it's an audio tag without controls (background).
            // Better check: If it's paused and we want to play it, make sure it's not "display:none" in styles.
            const style = window.getComputedStyle(media);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return;
            }

            // 1. Unmute for sound (try to enable sound)
            if (media.muted) media.muted = false;

            // 2. Ensure it is actually running
            if (media.paused && media.readyState > 2) {
                // Try playing
                media.play().catch(e => {
                    // If autoplay failed because of sound, mute and retry
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

    let lastClickTime = 0; // Prevent double-clicks globally
    let clickedSlides = new Set(); // Track clicked slides to enforce 1 click per slide

    function triggerClick(element) {
        const now = Date.now();
        if (now - lastClickTime < COOLDOWN_TIME) {
            console.log("[UMP] Cooldown active, skipping click");
            return;
        }

        console.log("[UMP] Unlocked! Clicking:", element);
        lastClickTime = now;

        // Visual Feedback (Green Flash)
        element.style.border = "5px solid #00ff00";

        const actualBtn = element.querySelector('button');

        // Dispatch Events (Simulate interaction)
        // EXCLUDE 'click' from here to avoid double-firing if we use actualBtn.click()
        const events = ['mouseover', 'mouseenter', 'mousedown', 'mouseup'];
        if (!actualBtn) {
            events.push('click'); // Only manually dispatch click if we can't find a button
        }

        events.forEach(type => {
            const evt = new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(evt);
        });

        if (actualBtn) {
            // This triggers a real click event which bubbles up
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
    // MAIN SEARCH LOGIC
    // =================================================================

    // To solve "double skip", we track the current slide ID (or timer text)
    // and ensure we only click ONCE for that specific state.
    let lastProcessedTimer = "";

    function scanAndWait() {
        // 1. Keep video running
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

        // Priority C: Text Search
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
            const timeLabel = document.querySelector(ISPRING_TIME_SELECTOR);

            // --- LOGIC A: ISPRING (Timer Based) ---
            if (timeLabel && target.classList.contains('next')) {
                const text = timeLabel.innerText || "";
                const times = text.split('/');

                // Track state to prevent double skipping on SAME slide
                // If the time label text (e.g. "00:54 / 00:54") is EXACTLY the same as when we last clicked,
                // we assume we are still on the old slide or transitioning.
                const isSameStateAsLastClick = (lastProcessedTimer === text);

                if (times.length === 2) {
                    const currentSec = parseSeconds(times[0]);
                    const totalSec = parseSeconds(times[1]);
                    const isFinished = currentSec >= (totalSec - 1);

                    if (isFinished) {
                        // UNLOCKED by timer
                        if (!isSameStateAsLastClick) {
                            const now = Date.now();
                            if (now - lastClickTime >= COOLDOWN_TIME) {
                                target.style.border = "5px solid #00ff00";
                                console.log("[UMP] iSpring timer done! Clicking:", target);

                                lastClickTime = now;
                                lastProcessedTimer = text; // Remember this state as "clicked"

                                const actualBtn = target.querySelector('button');

                                // Dispatch Events (Simulate interaction)
                                // EXCLUDE 'click' if we have a button to click
                                const events = ['mouseover', 'mouseenter', 'mousedown', 'mouseup'];
                                if (!actualBtn) {
                                    events.push('click');
                                }

                                events.forEach(type => {
                                    const evt = new MouseEvent(type, {
                                        bubbles: true,
                                        cancelable: true,
                                        view: window
                                    });
                                    target.dispatchEvent(evt);
                                });

                                if (actualBtn) actualBtn.click();
                            } else {
                                // Cooldown active
                                target.style.border = "5px solid #00ff00";
                            }
                        } else {
                            // We already clicked for this specific time state. Wait for slide to change.
                            target.style.border = "5px solid #00ff00";
                            // console.log("[UMP] Waiting for slide change...");
                        }
                    } else {
                        // LOCKED by timer: Wait
                        target.style.border = "5px solid #FFFF00";
                        // If we are waiting, reset the "last processed" tracker so next time we finish, we can click again (if it was partial reset)
                        // But usually we just wait for next slide.
                    }
                }
            }
            // --- LOGIC B: CLASSIC / GENERIC ---
            else {
                const isLocked = target.classList.contains('disabled') ||
                                 target.classList.contains('blocked') ||
                                 target.classList.contains('cs-disabled') ||
                                 target.classList.contains('btn-disabled') ||
                                 target.getAttribute('aria-disabled') === 'true';

                if (isLocked) {
                    target.style.border = "5px solid #FFFF00";
                } else {
                    // For Classic, we rely on cooldown mainly.
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

