(function() {
    'use strict';

    // --- CONFIGURATION ---
    const TARGET_TEXTS = ["NASTĘPNY", "DALEJ", "NEXT"];
    const POLLING_INTERVAL = 2000; // Check every 2s
    const PLAYBACK_SPEED = 1.0;    

    // --- HELPER: ENSURE VIDEO PLAYS ---
    function ensureMediaPlaying() {
        const mediaElements = document.querySelectorAll('video, audio');
        mediaElements.forEach(media => {
            // 1. Mute is required for auto-progress
            if (!media.muted) media.muted = true;
            
            // 2. Ensure it is actually running
            if (media.paused && media.readyState > 2) {
                media.play().catch(e => {}); 
            }

            // 3. Set Speed
            if (media.playbackRate !== PLAYBACK_SPEED) {
                media.playbackRate = PLAYBACK_SPEED;
            }
        });
    }

    // --- HELPER: SAFE CLICKER ---
    function triggerClick(element) {
        console.log("[UMP Fix] Unlocked! Clicking:", element);
        
        // Visual Feedback (Green Flash)
        element.style.border = "5px solid #00ff00"; 

        // 1. Dispatch Events (The most reliable way for iSpring)
        // We send these to the Container AND the specific Button
        const events = ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'];
        
        events.forEach(type => {
            const evt = new MouseEvent(type, {
                bubbles: true, 
                cancelable: true, 
                view: window
            });
            element.dispatchEvent(evt);
        });

        // 2. Find the specific HTML button inside and click it (ignoring SVGs)
        // This fixes the "child.click is not a function" error
        const actualBtn = element.querySelector('button');
        if (actualBtn) {
            actualBtn.click();
        }
    }

    // --- MAIN SEARCH LOGIC ---
    function scanAndWait() {
        // 1. Keep video running
        ensureMediaPlaying();

        // 2. Find the container
        let target = null;
        
        // Priority A: The specific class from your screenshot
        const directMatch = document.querySelector('.component_container.next');
        if (directMatch && directMatch.offsetParent !== null) {
            target = directMatch;
        }

        // Priority B: Text Search (Fallback)
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
            // Check for the "disabled" class (Moodle/iSpring lock)
            const isLocked = target.classList.contains('disabled') || 
                             target.classList.contains('blocked') || 
                             target.getAttribute('aria-disabled') === 'true';

            if (isLocked) {
                // LOCKED: Wait.
                target.style.border = "3px solid #FFFF00"; // Yellow = Waiting
            } else {
                // UNLOCKED: Click.
                triggerClick(target);
            }
        }
    }

    // --- INIT ---
    setInterval(scanAndWait, POLLING_INTERVAL);

})();
