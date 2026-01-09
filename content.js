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

    console.log('[UMP] Script loaded and running in iframe');

    // Helper: Smart Video Manager (Fixes "10 Voices" Bug)
    let hasSimulatedInteraction = false;

    function manageVideoState() {
        const allMedia = document.querySelectorAll('video, audio');

        if (allMedia.length > 0 && !hasSimulatedInteraction) {
            console.log(`[UMP Audio] Found ${allMedia.length} media element(s)`);
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

            // 3. Set playback speed
            if (media.playbackRate !== PLAYBACK_SPEED) media.playbackRate = PLAYBACK_SPEED;

            // 4. Simulate user interaction ONCE to enable autoplay
            if (!hasSimulatedInteraction) {
                // Dispatch events to simulate user interaction
                ['click', 'touchstart', 'pointerdown'].forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true, cancelable: true });
                    media.dispatchEvent(event);
                    document.dispatchEvent(event);
                });
                hasSimulatedInteraction = true;
                console.log('[UMP Audio] Simulated user interaction for autoplay');
            }

            // 5. Only play if paused and ready
            if (media.paused && media.readyState > 2) {
                media.play().catch(err => {
                    // Only mute if browser requires it for autoplay
                    console.log('[UMP Audio] Play failed, trying with mute:', err.message);
                    if (!media.muted) {
                        media.muted = true;
                        media.play().catch(() => {
                            console.log('[UMP Audio] Still cannot play, even muted');
                        });
                    }
                });
            }
        });
    }

    // Helper: Apply High-Vis Highlight (Fixes iSpring Border)
    function setHighlight(element, color) {
        if (!element) return;
        
        console.log(`[UMP Highlight] Applying ${color} highlight`);

        // Use multiple techniques for maximum visibility
        // !important ensures it won't be overridden by other styles
        element.style.setProperty('border', `10px solid ${color}`, 'important');
        element.style.setProperty('outline', `5px solid ${color}`, 'important');
        element.style.setProperty('outline-offset', '3px', 'important');
        element.style.setProperty('box-shadow', `0 0 30px 10px ${color}`, 'important');
        element.style.setProperty('position', 'relative', 'important');
        element.style.setProperty('z-index', '999999', 'important');

        // Force repaint
        element.offsetHeight;
    }

    function removeHighlight(element) {
        if (!element) return;
        console.log('[UMP Highlight] Removing highlight');
        element.style.removeProperty('border');
        element.style.removeProperty('outline');
        element.style.removeProperty('outline-offset');
        element.style.removeProperty('box-shadow');
        element.style.removeProperty('z-index');
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
            console.log('[UMP iSpring] Button found!');

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
                        console.log('[UMP iSpring] 🟢 Applying GREEN highlight');
                        setHighlight(nextBtn, "#00ff00"); // Green

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
                        console.log(`[UMP iSpring] 🟡 Applying YELLOW highlight (${currentSec}/${totalSec})`);
                        setHighlight(nextBtn, "#FFFF00"); // Yellow
                    }
                }
            } else {
                // No timer found, just show yellow
                console.log('[UMP iSpring] No timer found, applying YELLOW highlight');
                setHighlight(nextBtn, "#FFFF00");
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
