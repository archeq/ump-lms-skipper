(function() {
    'use strict';

    // =================================================================
    // CONFIGURATION
    // =================================================================
    
    const POLLING_INTERVAL = 1000; // Check every 1s
    const PLAYBACK_SPEED = 1.0;    // Safe speed for attendance

    // iSpring Settings
    const ISPRING_TIME_SELECTOR = '.label.time';       
    const ISPRING_NEXT_SELECTOR = '.component_container.next'; 

    // Classic/Articulate Settings
    const CLASSIC_BUTTONS = [
        '#next', 
        '#linkNext', 
        'button[aria-label="Next"]', 
        'button[aria-label="Dalej"]',
        'div.next-button',
        '.cs-next'
    ];
    const CLASSIC_DISABLED = ['cs-disabled', 'disabled', 'btn-disabled'];

    // =================================================================
    // SHARED UTILITIES
    // =================================================================

    if (window.self === window.top) return; // Exit if not in iframe

    console.log("[UMP Universal] Active. Scanning for player type...");

    // Helper: Keep videos running (Critical for both players)
    function keepMediaAlive() {
        document.querySelectorAll('video, audio').forEach(media => {
            if (!media.muted) media.muted = true; // Mute to bypass browser block
            if (media.playbackRate !== PLAYBACK_SPEED) media.playbackRate = PLAYBACK_SPEED;
            
            if (media.paused && media.readyState > 2) {
                media.play().catch(e => {}); 
            }
        });
    }

    // Helper: Parse "MM:SS" strings
    function parseSeconds(timeStr) {
        if (!timeStr) return 0;
        timeStr = timeStr.trim();
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return (parts[0] * 60) + parts[1];
        if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        return 0;
    }

    // =================================================================
    // LOGIC A: ISPRING (Timer Based)
    // =================================================================

    function runISpringLogic() {
        const timeLabel = document.querySelector(ISPRING_TIME_SELECTOR);
        const nextBtn = document.querySelector(ISPRING_NEXT_SELECTOR);

        if (timeLabel && nextBtn) {
            // Apply visual border (Pink = iSpring Mode detected)
            if (!nextBtn.style.border) nextBtn.style.border = "2px solid #ff00ff";

            const text = timeLabel.innerText || "";
            const times = text.split('/');

            if (times.length === 2) {
                const currentSec = parseSeconds(times[0]);
                const totalSec = parseSeconds(times[1]);

                // Check if finished (1s buffer)
                const isFinished = currentSec >= (totalSec - 1);

                if (isFinished) {
                    console.log("[UMP iSpring] Slide Done. Clicking...");
                    
                    // Green Flash
                    nextBtn.style.border = "5px solid #00ff00";

                    // Single Shot Click on Container
                    const events = ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'];
                    events.forEach(type => {
                        nextBtn.dispatchEvent(new MouseEvent(type, {
                            bubbles: true, cancelable: true, view: window
                        }));
                    });

                    return true; // Action taken
                } else {
                    // Waiting
                    nextBtn.style.border = "3px solid #FFFF00"; // Yellow
                }
            }
            return false; // Found player, but waiting
        }
        return null; // iSpring not found
    }

    // =================================================================
    // LOGIC B: CLASSIC / ARTICULATE (Attribute Based)
    // =================================================================

    function runClassicLogic() {
        let targetBtn = null;

        // Find first visible button from our list
        for (let selector of CLASSIC_BUTTONS) {
            const el = document.querySelector(selector);
            if (el && el.offsetParent !== null) {
                targetBtn = el;
                break;
            }
        }

        if (targetBtn) {
            // Apply visual border (Cyan = Classic Mode detected)
            if (!targetBtn.style.border) targetBtn.style.border = "2px solid #00ffff";

            // Check Disabled State
            const isClassDisabled = CLASSIC_DISABLED.some(cls => targetBtn.classList.contains(cls));
            const isAriaDisabled = targetBtn.getAttribute('aria-disabled') === 'true';

            if (!isClassDisabled && !isAriaDisabled) {
                console.log("[UMP Classic] Button Enabled. Clicking...");
                
                // Green Flash
                targetBtn.style.border = "5px solid #00ff00";

                // Standard Click
                targetBtn.click();
                
                return true; // Action taken
            } else {
                // Waiting
                targetBtn.style.border = "3px solid #FFFF00"; // Yellow
            }
            return false;
        }
        return null; // Classic player not found
    }

    // =================================================================
    // MAIN LOOP
    // =================================================================

    let isCoolingDown = false;

    setInterval(() => {
        keepMediaAlive(); // Universal Autoplay Fix

        if (isCoolingDown) return;

        // Priority 1: Try iSpring Logic
        // We try this first because it has a specific timer structure
        const iSpringResult = runISpringLogic();
        
        if (iSpringResult !== null) {
            // We are definitely in iSpring mode.
            if (iSpringResult === true) { 
                // We clicked. Cooldown.
                isCoolingDown = true;
                setTimeout(() => { isCoolingDown = false; }, 4000);
            }
            return; // Don't run Classic logic if iSpring was found
        }

        // Priority 2: Try Classic Logic
        const classicResult = runClassicLogic();

        if (classicResult === true) {
            // We clicked. Cooldown.
            isCoolingDown = true;
            setTimeout(() => { isCoolingDown = false; }, 2500);
        }

    }, POLLING_INTERVAL);

})();
