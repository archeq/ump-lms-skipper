(function() {
    'use strict';

    // =================================================================
    // CONFIGURATION
    // =================================================================
    
    const POLLING_INTERVAL = 1000; 
    const PLAYBACK_SPEED = 1.0;

    // iSpring Settings
    const ISPRING_TIME_SELECTOR = '.label.time';       
    const ISPRING_NEXT_SELECTOR = '.component_container.next'; 

    // Classic/Articulate Settings
    const CLASSIC_BUTTONS = [
        '#next', '#linkNext', 
        'button[aria-label="Next"]', 'button[aria-label="Dalej"]',
        'div.next-button', '.cs-next'
    ];
    const CLASSIC_DISABLED = ['cs-disabled', 'disabled', 'btn-disabled'];

    // =================================================================
    // SHARED UTILITIES
    // =================================================================

    if (window.self === window.top) return; 

    // Helper: Smart Video Manager (Preserves Sound)
    function manageVideoState() {
        document.querySelectorAll('video, audio').forEach(media => {
            if (media.playbackRate !== PLAYBACK_SPEED) media.playbackRate = PLAYBACK_SPEED;

            // Only act if paused
            if (media.paused && media.readyState > 2) {
                media.play().catch(() => {
                    // Only mute if absolutely required by browser
                    if (!media.muted) {
                        media.muted = true; 
                        media.play().catch(() => {});
                    }
                });
            }
        });
    }

    // Helper: Apply Border (The Fix)
    // Uses standard border + box-sizing to match your working snippet
    function setBorder(element, color) {
        if (!element) return;
        // !important ensures it overrides iSpring's CSS
        // box-sizing ensures the border is visible even inside overflow:hidden containers
        element.style.cssText += `border: 5px solid ${color} !important; box-sizing: border-box !important;`;
    }

    function removeBorder(element) {
        if (!element) return;
        element.style.border = "";
    }

    // Helper: Parse "MM:SS"
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
            const text = timeLabel.innerText || "";
            const times = text.split('/');

            if (times.length === 2) {
                const currentSec = parseSeconds(times[0]);
                const totalSec = parseSeconds(times[1]);
                
                // Check if finished (1s buffer)
                const isFinished = currentSec >= (totalSec - 1);

                if (isFinished) {
                    console.log("[UMP iSpring] Done. Clicking...");
                    setBorder(nextBtn, "#00ff00"); // Green Border

                    // Send Hover + Click events
                    ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'].forEach(type => {
                        nextBtn.dispatchEvent(new MouseEvent(type, {
                            bubbles: true, cancelable: true, view: window
                        }));
                    });

                    return true; // Clicked
                } else {
                    // Waiting
                    setBorder(nextBtn, "#FFFF00"); // Yellow Border
                }
            }
            return false; 
        }
        return null; 
    }

    // =================================================================
    // LOGIC B: CLASSIC (Attribute Based)
    // =================================================================

    function runClassicLogic() {
        let targetBtn = null;
        for (let selector of CLASSIC_BUTTONS) {
            const el = document.querySelector(selector);
            if (el && el.offsetParent !== null) {
                targetBtn = el;
                break;
            }
        }

        if (targetBtn) {
            const isClassDisabled = CLASSIC_DISABLED.some(cls => targetBtn.classList.contains(cls));
            const isAriaDisabled = targetBtn.getAttribute('aria-disabled') === 'true';

            if (!isClassDisabled && !isAriaDisabled) {
                console.log("[UMP Classic] Clicking...");
                setBorder(targetBtn, "#00ff00"); // Green
                targetBtn.click();
                return true; 
            } else {
                setBorder(targetBtn, "#FFFF00"); // Yellow
            }
            return false;
        }
        return null; 
    }

    // =================================================================
    // LOOP
    // =================================================================

    let isCoolingDown = false;

    setInterval(() => {
        manageVideoState(); 

        if (isCoolingDown) return;

        // 1. Try iSpring
        const iSpringResult = runISpringLogic();
        if (iSpringResult !== null) {
            if (iSpringResult === true) { 
                isCoolingDown = true;
                const btn = document.querySelector(ISPRING_NEXT_SELECTOR);
                setTimeout(() => { 
                    removeBorder(btn); 
                    isCoolingDown = false; 
                }, 4000);
            }
            return; 
        }

        // 2. Try Classic
        const classicResult = runClassicLogic();
        if (classicResult === true) {
            isCoolingDown = true;
            // Clear border instantly for classic players as they usually refresh the DOM
            setTimeout(() => { isCoolingDown = false; }, 2500);
        }

    }, POLLING_INTERVAL);

})();
