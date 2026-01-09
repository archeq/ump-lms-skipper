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
    // UTILITIES
    // =================================================================

    if (window.self === window.top) return; 

    // Helper: Smart Video Manager (Fixes the Mute Issue)
    function manageVideoState() {
        document.querySelectorAll('video, audio').forEach(media => {
            // Set speed preference
            if (media.playbackRate !== PLAYBACK_SPEED) media.playbackRate = PLAYBACK_SPEED;

            // ONLY kickstart if it is PAUSED
            if (media.paused && media.readyState > 2) {
                // We attempt to play. If it fails, we mute and try again.
                // This preserves sound if you manually unmuted it!
                media.play().catch(() => {
                    if (!media.muted) {
                        media.muted = true; // Only mute if absolutely necessary
                        media.play().catch(() => {});
                    }
                });
            }
        });
    }

    // Helper: High-Visibility Highlighter (Fixes the Border Issue)
    // Uses box-shadow (inset) which cannot be clipped by overflow:hidden
    function highlight(element, color) {
        if (!element) return;
        element.style.cssText += `
            box-shadow: inset 0 0 0 5px ${color} !important;
            z-index: 99999 !important;
        `;
    }

    function removeHighlight(element) {
        if (!element) return;
        element.style.boxShadow = "";
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
                
                // Allow 1s buffer
                const isFinished = currentSec >= (totalSec - 1);

                if (isFinished) {
                    console.log("[UMP iSpring] Done. Clicking...");
                    highlight(nextBtn, "#00ff00"); // Green

                    // Hover + Click events
                    ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'].forEach(type => {
                        nextBtn.dispatchEvent(new MouseEvent(type, {
                            bubbles: true, cancelable: true, view: window
                        }));
                    });

                    return true; // Clicked
                } else {
                    highlight(nextBtn, "#FF00FF"); // Magenta = Waiting (High Contrast)
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
                highlight(targetBtn, "#00ff00"); // Green
                targetBtn.click();
                return true; 
            } else {
                highlight(targetBtn, "#FFFF00"); // Yellow = Waiting
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
        manageVideoState(); // Keeps videos playing without forcing mute

        if (isCoolingDown) return;

        // 1. Try iSpring
        const iSpringResult = runISpringLogic();
        if (iSpringResult !== null) {
            if (iSpringResult === true) { 
                isCoolingDown = true;
                const btn = document.querySelector(ISPRING_NEXT_SELECTOR);
                setTimeout(() => { 
                    removeHighlight(btn); 
                    isCoolingDown = false; 
                }, 4000);
            }
            return; 
        }

        // 2. Try Classic
        const classicResult = runClassicLogic();
        if (classicResult === true) {
            isCoolingDown = true;
            setTimeout(() => { isCoolingDown = false; }, 2500);
        }

    }, POLLING_INTERVAL);

})();
