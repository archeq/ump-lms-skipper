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

    console.log('[UMP] Script loaded and running');


    // Helper: Smart Video Manager (Same logic as old working code)
    let hasSimulatedInteraction = false;

    function manageVideoState() {
        const allMedia = document.querySelectorAll('video, audio');

        if (allMedia.length > 0 && !hasSimulatedInteraction) {
            console.log(`[UMP Audio] Found ${allMedia.length} media element(s)`);

            // Simulate user interaction ONCE for ALL media elements
            ['click', 'touchstart', 'pointerdown'].forEach(eventType => {
                const event = new Event(eventType, { bubbles: true, cancelable: true });
                document.dispatchEvent(event);
            });
            hasSimulatedInteraction = true;
            console.log('[UMP Audio] Simulated user interaction for autoplay');
        }

        allMedia.forEach(media => {
            // 1. VISIBILITY CHECK:
            // Skip if the element or any parent is hidden (display: none)
            let element = media;
            let isHidden = false;

            while (element && element !== document.body) {
                const style = window.getComputedStyle(element);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                    isHidden = true;
                    break;
                }
                element = element.parentElement;
            }

            // If hidden, pause it and skip
            if (isHidden) {
                if (!media.paused) {
                    media.pause();
                }
                return;
            }

            // 2. Check if media dimensions are 0 (another way elements can be "hidden")
            if (media.offsetWidth === 0 || media.offsetHeight === 0 || media.offsetParent === null) {
                if (!media.paused) {
                    media.pause();
                }
                return;
            }

            // 3. Mute is REQUIRED for autoplay (same as old code)
            if (!media.muted) {
                media.muted = true;
                console.log('[UMP Audio] Muted media element for autoplay');
            }

            // 4. Set playback speed
            if (media.playbackRate !== PLAYBACK_SPEED) {
                media.playbackRate = PLAYBACK_SPEED;
            }

            // 5. Ensure it is actually running
            if (media.paused && media.readyState > 2) {
                media.play().catch(err => {
                    console.log('[UMP Audio] Play failed even with mute:', err.message);
                });
            }
        });
    }

    // Helper: Apply High-Vis Highlight (Same as old working code)
    function setHighlight(element, color) {
        if (!element) {
            console.log('[UMP Highlight] ERROR: Element is null!');
            return;
        }

        try {
            console.log(`[UMP Highlight] Applying ${color} highlight to:`, element.className);

            // Use the EXACT same method as the old working code
            // Simple direct assignment works better than setProperty with !important
            element.style.border = `5px solid ${color}`;

            console.log(`[UMP Highlight] ✅ Successfully applied ${color} highlight`);
        } catch (err) {
            console.error('[UMP Highlight] ERROR applying highlight:', err);
        }
    }

    function removeHighlight(element) {
        if (!element) return;
        console.log('[UMP Highlight] Removing highlight');
        element.style.border = "";
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

    let lastISpringClickTime = 0; // Track when we last clicked to prevent double-clicks

    function runISpringLogic() {
        const nextBtn = document.querySelector(ISPRING_NEXT_SELECTOR);
        const timeLabel = document.querySelector(ISPRING_TIME_SELECTOR);

        if (nextBtn) {
            console.log('[UMP iSpring] Button found!', nextBtn);

            if (timeLabel) {
                const text = timeLabel.innerText || "";
                const times = text.split('/');

                if (times.length === 2) {
                    const currentSec = parseSeconds(times[0]);
                    const totalSec = parseSeconds(times[1]);

                    // Check if finished (1s buffer)
                    const isFinished = currentSec >= (totalSec - 1);

                    if (isFinished) {
                        // ALWAYS apply green highlight when finished (fixes iSpring highlight bug)
                        console.log('[UMP iSpring] 🟢 Video finished, calling setHighlight...');
                        setHighlight(nextBtn, "#00ff00"); // Green
                        console.log('[UMP iSpring] setHighlight called with GREEN');

                        // Only click if enough time has passed since last click
                        const now = Date.now();
                        if (now - lastISpringClickTime > COOLDOWN_TIME) {
                            console.log(`[UMP iSpring] ✅ Timer Done (${currentSec}/${totalSec}). Clicking!`);
                            lastISpringClickTime = now;
                            triggerOneClick(nextBtn);
                            return true; // Return TRUE to trigger cooldown
                        }
                    } else {
                        // ALWAYS apply yellow highlight when waiting (fixes iSpring highlight bug)
                        console.log(`[UMP iSpring] 🟡 Video playing (${currentSec}/${totalSec}), calling setHighlight...`);
                        setHighlight(nextBtn, "#FFFF00"); // Yellow
                        console.log('[UMP iSpring] setHighlight called with YELLOW');
                    }
                }
            } else {
                // No timer found, just show yellow
                console.log('[UMP iSpring] No timer found, calling setHighlight...');
                setHighlight(nextBtn, "#FFFF00");
                console.log('[UMP iSpring] setHighlight called with YELLOW (no timer)');
            }
            return false; // Found button, not finished
        }

        return null; // Not iSpring
    }

    // =================================================================
    // LOGIC B: CLASSIC (Attribute/Lock Based)
    // =================================================================

    let lastClassicClickTime = 0; // Track when we last clicked to prevent double-clicks

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
                // ALWAYS apply green highlight when unlocked
                setHighlight(targetBtn, "#00ff00"); // Green

                // Only click if enough time has passed since last click
                const now = Date.now();
                if (now - lastClassicClickTime > COOLDOWN_TIME) {
                    console.log("[UMP Classic] ✅ Button Unlocked. Clicking!");
                    lastClassicClickTime = now;
                    triggerOneClick(targetBtn);
                    return true;
                }
            } else {
                // ALWAYS apply yellow highlight when locked
                setHighlight(targetBtn, "#FFFF00"); // Yellow
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
