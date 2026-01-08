(function() {
    'use strict';

    // --- CONFIGURATION ---
    const CONTAINER_SELECTOR = '.component_container.next'; 
    const LOCKED_CLASS = 'disabled';
    const POLLING_INTERVAL = 500; // Check fast (every 0.5s)

    // --- CONTEXT CHECK ---
    if (window.self === window.top) return;

    console.log("[UMP Speedrunner] Active. Bypassing media & locks...");

    // --- HELPER 1: THE MEDIA SKIPPER ---
    // Instead of playing (which fails), we skip to the end.
    function skipMedia() {
        const mediaElements = document.querySelectorAll('video, audio');
        
        mediaElements.forEach(media => {
            // 1. Mute to prevent audio glitches
            if (!media.muted) media.muted = true;

            // 2. If it has a duration, skip to the end
            if (media.duration && !isNaN(media.duration)) {
                // If we aren't at the end yet, skip there
                if (media.currentTime < media.duration - 0.5) {
                    console.log("[UMP Speedrunner] Skipping media to end...");
                    try {
                        media.currentTime = media.duration; 
                        // Sometimes triggering 'ended' manually helps iSpring realize it's done
                        media.dispatchEvent(new Event('ended'));
                    } catch (e) {
                        // Ignore errors if media isn't fully loaded yet
                    }
                }
            }
        });
    }

    // --- HELPER 2: THE LOCK PICKER ---
    function forceUnlockAndClick(container) {
        // 1. Force remove the disabled class
        if (container.classList.contains(LOCKED_CLASS)) {
            console.log("[UMP Speedrunner] Removing 'disabled' lock manually...");
            container.classList.remove(LOCKED_CLASS);
            container.removeAttribute('disabled');
            container.setAttribute('aria-disabled', 'false');
        }

        // 2. Visual Feedback (Cyan Border = We forced it open)
        const oldBorder = container.style.border;
        container.style.border = "5px solid #00ffff"; 

        // 3. Click Sequence
        // iSpring needs the hover events to register the button as "active"
        const events = [
            new MouseEvent('mouseover', { bubbles: true, view: window }),
            new MouseEvent('mouseenter', { bubbles: true, view: window }),
            new MouseEvent('mousedown', { bubbles: true, view: window }),
            new MouseEvent('mouseup', { bubbles: true, view: window }),
            new MouseEvent('click', { bubbles: true, view: window })
        ];
        
        events.forEach(evt => container.dispatchEvent(evt));

        // 4. Also click the button inside, just to be sure
        const childBtn = container.querySelector('button');
        if (childBtn) {
            childBtn.click();
        }

        // 5. Cleanup
        setTimeout(() => {
            if(container) container.style.border = oldBorder;
        }, 1000);
    }

    // --- MAIN ENGINE ---
    let isCoolingDown = false;

    setInterval(() => {
        // 1. Constantly try to skip media to avoid "NotAllowedError"
        skipMedia();

        if (isCoolingDown) return;

        const container = document.querySelector(CONTAINER_SELECTOR);

        if (container) {
            // Check if visible (we don't want to click invisible buttons)
            const isVisible = container.offsetParent !== null;

            if (isVisible) {
                // We DON'T check if it's locked. We unlock it ourselves.
                forceUnlockAndClick(container);

                // Longer cooldown to allow the next slide to load
                isCoolingDown = true;
                setTimeout(() => {
                    isCoolingDown = false;
                }, 4000); // 4 seconds wait
            }
        } 
    }, POLLING_INTERVAL);

})();
