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

    // Classic/Articulate/Iframe Settings
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

    // Helper: Apply Border (Merged Logic)
    function setBorder(element, color) {
        if (!element) return;
        // We use the direct style approach from Code B, but keep box-sizing from Code A
        element.style.border = `5px solid ${color}`;
        element.style.boxSizing = "border-box"; 
        // Force relative position if static, to ensure border shows inside complex layouts
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
    }

    function removeBorder(element) {
        if (!element) return;
        element.style.border = "";
    }

    // Helper: Robust Clicker (Taken from Code B)
    function triggerSafeClick(element) {
        console.log("[UMP Action] Clicking:", element);
        
        // 1. Dispatch Events (The most reliable way for iSpring)
        const events = ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'];
        events.forEach(type => {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true, cancelable: true, view: window
            }));
        });

        // 2. Find specific HTML button inside and click it (Fixes child element issues)
        const actualBtn = element.querySelector('button');
        if (actualBtn) {
            actualBtn.click();
        } else {
            element.click();
        }
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
        const nextBtn = document.querySelector(ISPRING_NEXT_SELECTOR);
        const timeLabel = document.querySelector(ISPRING_TIME_SELECTOR);

        // If we found the button, we assume this IS an iSpring player
        if (nextBtn) {
            
            // 1. Default State: Yellow (Found, Waiting)
            setBorder(nextBtn, "#FFFF00");

            if (timeLabel) {
                const text = timeLabel.innerText || "";
                const times = text.split('/');

                if (times.length === 2) {
                    const currentSec = parseSeconds(times[0]);
                    const totalSec = parseSeconds(times[1]);
                    
                    // Check if finished (1s buffer)
                    const isFinished = currentSec >= (totalSec - 1);

                    if (isFinished) {
                        console.log("[UMP iSpring] Timer Done. Clicking...");
                        setBorder(nextBtn, "#00ff00"); // Green Border
                        triggerSafeClick(nextBtn);
                        return true; // Clicked
                    }
                }
            }
            return false; // Found button, but not time yet
        }
        return null; // Not iSpring
    }

    // =================================================================
    // LOGIC B: CLASSIC (Attribute/Lock Based)
    // =================================================================

    function runClassicLogic() {
        let targetBtn = null;
        for (let selector of CLASSIC_BUTTONS) {
            const el = document.querySelector(selector);
            // Check offsetParent to ensure it's visible
            if (el && el.offsetParent !== null) {
                targetBtn = el;
                break;
            }
        }

        if (targetBtn) {
            // 1. Default State: Yellow (Found, Waiting)
            setBorder(targetBtn, "#FFFF00");

            const isClassDisabled = CLASSIC_DISABLED.some(cls => targetBtn.classList.contains(cls));
            const isAriaDisabled = targetBtn.getAttribute('aria-disabled') === 'true';

            if (!isClassDisabled && !isAriaDisabled) {
                console.log("[UMP Classic] Unlocked. Clicking...");
                setBorder(targetBtn, "#00ff00"); // Green
                triggerSafeClick(targetBtn);
                return true; 
            }
            return false; // Found but locked
        }
        return null; // Not Classic
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
        
        // If iSpring detected button (true or false), stop there. don't run classic logic.
        if (iSpringResult !== null) {
            if (iSpringResult === true) { // Clicked
                isCoolingDown = true;
                const btn = document.querySelector(ISPRING_NEXT_SELECTOR);
                setTimeout(() => { 
                    removeBorder(btn); 
                    isCoolingDown = false; 
                }, 4000);
            }
            return; 
        }

        // 2. Try Classic (Only if iSpring wasn't found)
        const classicResult = runClassicLogic();
        if (classicResult === true) {
            isCoolingDown = true;
            setTimeout(() => { isCoolingDown = false; }, 2500);
        }

    }, POLLING_INTERVAL);

})();
