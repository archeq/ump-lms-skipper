(function() {
    'use strict';

    // =================================================================
    // CONFIGURATION
    // =================================================================
    
    const POLLING_INTERVAL = 1000; 
    const PLAYBACK_SPEED = 1.0;
    const COOLDOWN_TIME = 3000; // Increased to 3s to prevent double-skips

    // iSpring Settings
    const ISPRING_TIME_SELECTOR = '.label.time';       
    const ISPRING_NEXT_SELECTOR = '.component_container.next'; 

    // Classic/Iframe Settings
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

    // Helper: Smart Video Manager (Fixes "10 Voices" Bug)
    function manageVideoState() {
        document.querySelectorAll('video, audio').forEach(media => {
            // 1. VISIBILITY CHECK:
            // If the media (or its parent) is hidden (display: none), ignore it.
            // This prevents playing audio from future/past slides.
            if (media.offsetParent === null && media.tagName !== 'AUDIO') return; // Video hidden
            
            // For Audio tags (which are invisible by nature), we check if they are
            // inside a hidden container.
            if (media.tagName === 'AUDIO') {
                let parent = media.parentElement;
                while (parent) {
                    if (window.getComputedStyle(parent).display === 'none') return;
                    parent = parent.parentElement;
                }
            }

            if (media.playbackRate !== PLAYBACK_SPEED) media.playbackRate = PLAYBACK_SPEED;

            // Only act if paused and ready
            if (media.paused && media.readyState > 2) {
                media.play().catch(() => {
                    // Only mute if absolutely required by browser to force play
                    if (!media.muted) {
                        media.muted = true; 
                        media.play().catch(() => {});
                    }
                });
            }
        });
    }

    // Helper: Apply High-Vis Highlight (Fixes iSpring Border)
    function setHighlight(element, color) {
        if (!element) return;
        
        // Use outline AND box-shadow to ensure visibility on top of video players
        // 'outline' sits outside/on-top, 'box-shadow' sits inside.
        // We use !important to override player styles.
        element.style.cssText += `
            outline: 5px solid ${color} !important;
            outline-offset: -5px !important; 
            box-shadow: 0 0 15px ${color} !important;
            opacity: 1 !important; 
            visibility: visible !important;
            z-index: 9999 !important;
        `;
    }

    function removeHighlight(element) {
        if (!element) return;
        element.style.outline = "";
        element.style.boxShadow = "";
    }

    // Helper: Precise Clicker (Fixes Double Skip)
    function triggerOneClick(element) {
        console.log("[UMP Action] Clicking:", element);
        
        // 1. Try to find a real button inside (common in iSpring)
        const innerBtn = element.querySelector('button');
        
        if (innerBtn) {
            innerBtn.click();
        } else {
            // 2. Fallback: Click the container itself
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

        if (nextBtn) {
            // Default: Yellow (Waiting)
            setHighlight(nextBtn, "#FFFF00");

            if (timeLabel) {
                const text = timeLabel.innerText || "";
                const times = text.split('/');

                if (times.length === 2) {
                    const currentSec = parseSeconds(times[0]);
                    const totalSec = parseSeconds(times[1]);
                    
                    // Check if finished (1s buffer)
                    const isFinished = currentSec >= (totalSec - 1);

                    if (isFinished) {
                        console.log("[UMP iSpring] Timer Done.");
                        setHighlight(nextBtn, "#00ff00"); // Green
                        triggerOneClick(nextBtn);
                        return true; // Return TRUE to trigger cooldown
                    }
                }
            }
            return false; // Found button, not finished
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
            if (el && el.offsetParent !== null) {
                targetBtn = el;
                break;
            }
        }

        if (targetBtn) {
            // Default: Yellow (Found)
            setHighlight(targetBtn, "#FFFF00");

            const isClassDisabled = CLASSIC_DISABLED.some(cls => targetBtn.classList.contains(cls));
            const isAriaDisabled = targetBtn.getAttribute('aria-disabled') === 'true';

            if (!isClassDisabled && !isAriaDisabled) {
                console.log("[UMP Classic] Unlocked.");
                setHighlight(targetBtn, "#00ff00"); // Green
                triggerOneClick(targetBtn);
                return true; 
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
        // Prevent action if we just clicked
        if (isCoolingDown) {
            manageVideoState(); // Keep managing video even during cooldown
            return;
        }

        manageVideoState(); 

        // 1. Try iSpring
        const iSpringResult = runISpringLogic();
        
        if (iSpringResult !== null) {
            if (iSpringResult === true) { 
                isCoolingDown = true;
                const btn = document.querySelector(ISPRING_NEXT_SELECTOR);
                
                // Remove highlight and reset cooldown after delay
                setTimeout(() => { 
                    removeHighlight(btn); 
                    isCoolingDown = false; 
                }, COOLDOWN_TIME);
            }
            return; 
        }

        // 2. Try Classic (Only if iSpring wasn't detected)
        const classicResult = runClassicLogic();
        if (classicResult === true) {
            isCoolingDown = true;
            setTimeout(() => { isCoolingDown = false; }, COOLDOWN_TIME);
        }

    }, POLLING_INTERVAL);

})();
