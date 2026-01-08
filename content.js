(function() {
    'use strict';

    // --- 1. UNIVERSAL SELECTOR LIST ---
    // Combined list for Articulate, iSpring, Captivate, and Polish Moodle
    const TARGET_SELECTORS = [
        // Articulate / Storyline (First Player)
        '#next', 
        '#linkNext',
        'button[aria-label="Next"]',
        'button[aria-label="Dalej"]',
        
        // iSpring (Second Player)
        '.next-button',
        '.tech_next_btn',
        'div[title="Next"]',
        'div[title="Dalej"]',
        '.player_navbar_right_control',
        '.ispring-button-next'
    ];

    const DISABLED_CLASSES = ['cs-disabled', 'disabled', 'blocked', 'hidden', 'state-disabled'];
    
    // --- CONTEXT CHECK ---
    // Only run if we are inside an iframe (where the players live)
    if (window.self === window.top) return;

    console.log("[UMP Universal] Iframe active. Scanning for ANY player type...");

    // --- HELPER: KEYBOARD NAVIGATION (iSpring Fallback) ---
    function fireKeyboardNext() {
        const eventArgs = {
            key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, which: 39,
            bubbles: true, cancelable: true, view: window
        };
        document.body.dispatchEvent(new KeyboardEvent('keydown', eventArgs));
        document.body.dispatchEvent(new KeyboardEvent('keyup', eventArgs));
    }

    // --- HELPER: MOUSE CLICK ---
    function fireClick(element) {
        const args = { bubbles: true, cancelable: true, view: window };
        element.dispatchEvent(new MouseEvent('mousedown', args));
        element.dispatchEvent(new MouseEvent('mouseup', args));
        element.click();
    }

    // --- HELPER: AUTOPLAY FIXER ---
    // Finds stuck videos, mutes them, and forces play
    function forceMediaPlay() {
        document.querySelectorAll('video, audio').forEach(media => {
            if (!media.muted) media.muted = true; // Required by Chrome
            if (media.paused) media.play().catch(() => {});
        });
    }

    // --- MAIN ENGINE ---
    let isCoolingDown = false;

    setInterval(() => {
        // 1. Always keep media playing
        forceMediaPlay();

        // 2. Don't spam clicks if we just clicked
        if (isCoolingDown) return;

        // 3. Scan for a valid button
        let targetBtn = null;
        for (let selector of TARGET_SELECTORS) {
            const candidates = document.querySelectorAll(selector);
            for (let btn of candidates) {
                // Check if visible
                const style = window.getComputedStyle(btn);
                const isHidden = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
                
                // Check if disabled class is present
                const isDisabled = DISABLED_CLASSES.some(cls => btn.classList.contains(cls)) || 
                                   btn.getAttribute('aria-disabled') === 'true';

                if (!isHidden && !isDisabled) {
                    targetBtn = btn;
                    break; 
                }
            }
            if (targetBtn) break;
        }

        // 4. EXECUTE
        if (targetBtn) {
            console.log("[UMP Universal] Button Found:", targetBtn);
            
            // Visual Feedback (Green Flash)
            const originalBorder = targetBtn.style.border;
            targetBtn.style.border = "4px solid #00ff00";

            // Click it
            fireClick(targetBtn);
            
            // Cooldown logic
            isCoolingDown = true;
            setTimeout(() => {
                targetBtn.style.border = originalBorder;
                isCoolingDown = false;
            }, 2500); // Wait 2.5s before looking again (Articulate needs this)

        } else {
            // 5. No button found? It might be iSpring using Canvas.
            // Try the keyboard shortcut blindly, but less frequently.
            // We use a random check to run this roughly every 3-4 seconds
            if (Math.random() > 0.7) { 
                // console.log("[UMP Universal] No button visible. Trying Keyboard...");
                fireKeyboardNext();
            }
        }

    }, 1000); // Check state every 1 second

})();
