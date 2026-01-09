(function() {
    'use strict';

    // --- CONFIGURATION ---
    const TARGET_TEXTS = ["NASTĘPNY", "DALEJ", "NEXT"];
    const POLLING_INTERVAL = 2000; // Check every 2 seconds
    const PLAYBACK_SPEED = 1.0;    // Set to 1.0 for normal speed, 2.0 to watch 2x faster

    // --- HELPER: ENSURE VIDEO PLAYS (Don't Skip) ---
    function ensureMediaPlaying() {
        const mediaElements = document.querySelectorAll('video, audio');
        mediaElements.forEach(media => {
            // 1. Mute to bypass browser "NotAllowedError" (Crucial!)
            if (!media.muted) media.muted = true;
            
            // 2. Ensure it is actually running
            if (media.paused && media.readyState > 2) {
                // console.log("[UMP Watcher] Kicking video start...");
                media.play().catch(e => {}); 
            }

            // 3. Optional: Set Speed (Teachers check duration, but 1.5x/2x is usually safe)
            if (media.playbackRate !== PLAYBACK_SPEED) {
                media.playbackRate = PLAYBACK_SPEED;
            }
        });
    }

    // --- HELPER: CLICKER ---
    function triggerClick(element) {
        console.log("[UMP Watcher] Video finished. Clicking NEXT:", element);
        
        // Visual Feedback (Green Flash)
        element.style.border = "5px solid #00ff00"; 

        // Sequence of events to register the click
        const events = ['mouseover', 'mousedown', 'mouseup', 'click'];
        events.forEach(type => {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true, cancelable: true, view: window
            }));
        });

        // Click children too (often the button is inside the div)
        const children = element.querySelectorAll('*');
        children.forEach(child => child.click());
    }

    // --- MAIN SEARCH LOGIC ---
    function scanAndWait() {
        // 1. Keep the video running so the timer counts down
        ensureMediaPlaying();

        // 2. Find the button/container
        // Strategy A: Specific iSpring Class
        let target = null;
        const candidates = document.querySelectorAll('.component_container.next, .component_base.next');
        
        for (let el of candidates) {
            if (el.offsetParent !== null) { // Visible?
                target = el;
                break;
            }
        }

        // Strategy B: Text Search (Fallback)
        if (!target) {
            const allDivs = document.querySelectorAll('div, button, span');
            for (let el of allDivs) {
                if (el.innerText && TARGET_TEXTS.includes(el.innerText.trim().toUpperCase())) {
                    if (el.offsetParent !== null && el.tagName !== 'SCRIPT') {
                        // Climb up to finding container
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

        // 3. Check Status
        if (target) {
            // Is it locked? (iSpring adds 'disabled' or 'blocked' class)
            const isLocked = target.classList.contains('disabled') || 
                             target.classList.contains('blocked') || 
                             target.getAttribute('aria-disabled') === 'true';

            if (isLocked) {
                // LOCKED: Do nothing. Just wait.
                // console.log("[UMP Watcher] Button found but LOCKED. Watching video...");
                
                // Visual Feedback: Yellow Border (Waiting)
                target.style.border = "3px solid #FFFF00"; 
            } else {
                // UNLOCKED: The video must be done!
                triggerClick(target);
            }
        }
    }

    // --- INIT ---
    setInterval(scanAndWait, POLLING_INTERVAL);

})();
