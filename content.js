(function() {
    'use strict';

    // --- CONFIGURATION ---
    
    // 1. The Big "Start" Overlay (Must click this first if present)
    const START_OVERLAYS = [
        '.play-button', 
        '.start-button',
        '.big-play-btn',
        '#sys-start-btn',
        '.click-to-start'
    ];

    // 2. The "Next" Navigation Buttons (iSpring specific)
    const NEXT_BUTTONS = [
        '.tech_next_btn',               // Classic iSpring
        '.ip-control-bar__btn_next',    // Modern iSpring
        '.ism-player-btn-next',         // Mobile/Responsive Skin
        'div[title="Next"]', 
        'div[title="Dalej"]',
        '.button-next',
        '.next-button'
    ];

    const ACTION_DELAY = 2000; // Check every 2 seconds

    // --- CONTEXT CHECK ---
    if (window.self === window.top) return; // Exit if not in iframe

    console.log("[UMP iSpring] Active in Iframe. Hunting for controls...");

    // --- LOGIC ---

    function triggerEvent(element, eventType) {
        const event = new MouseEvent(eventType, {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
    }

    function clickElement(btn, label) {
        if (!btn) return;
        
        console.log(`[UMP iSpring] Clicking ${label}...`);
        
        // 1. Visual Feedback
        const originalBorder = btn.style.border;
        btn.style.border = "5px solid #ff00ff"; // Magenta border for visibility

        // 2. Click Sequence (Down -> Up -> Click)
        // iSpring is picky about mouse events.
        triggerEvent(btn, 'mouseover');
        triggerEvent(btn, 'mousedown');
        triggerEvent(btn, 'mouseup');
        triggerEvent(btn, 'click');

        // 3. Cleanup
        setTimeout(() => {
            btn.style.border = originalBorder;
        }, 500);
    }

    function forceKeyboardNext() {
        console.log("[UMP iSpring] Sending Keyboard 'Right Arrow'...");
        
        // 1. Force Focus (Crucial for keyboard events to register)
        window.focus();
        if (document.activeElement) {
            document.activeElement.blur();
        }
        document.body.focus();

        // 2. Dispatch Key Events
        const keyData = {
            key: 'ArrowRight', code: 'ArrowRight', 
            keyCode: 39, which: 39, 
            bubbles: true, cancelable: true, view: window 
        };

        document.dispatchEvent(new KeyboardEvent('keydown', keyData));
        document.dispatchEvent(new KeyboardEvent('keyup', keyData));
    }

    // --- MAIN LOOP ---
    setInterval(() => {
        // STEP 1: Handle "Click to Start" overlays
        for (let selector of START_OVERLAYS) {
            const overlay = document.querySelector(selector);
            // Check if visible
            if (overlay && overlay.offsetParent !== null) { 
                clickElement(overlay, "Start Overlay");
                return; // Stop here, wait for next loop
            }
        }

        // STEP 2: Handle Muting (Required for playback)
        document.querySelectorAll('video, audio').forEach(media => {
            if (!media.muted) media.muted = true;
            if (media.paused) media.play().catch(() => {});
        });

        // STEP 3: Try clicking visual "Next" buttons
        let buttonFound = false;
        for (let selector of NEXT_BUTTONS) {
            const btn = document.querySelector(selector);
            // Check visibility and disabled state
            if (btn && btn.offsetParent !== null && !btn.classList.contains('disabled') && !btn.classList.contains('state-disabled')) {
                clickElement(btn, "Next Button");
                buttonFound = true;
                break;
            }
        }

        // STEP 4: Fallback to Keyboard if no button found
        if (!buttonFound) {
            // Only try keyboard if we haven't found a button, 
            // to avoid skipping slides too fast.
            forceKeyboardNext();
        }

    }, ACTION_DELAY);

})();
