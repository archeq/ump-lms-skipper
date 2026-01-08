(function() {
    'use strict';

    // 1. CONFIGURATION
    const BUTTON_SELECTOR = '#next'; 
    const DISABLED_CLASS = 'cs-disabled';
    // Increased safety delay to prevent crashing the player
    const CLICK_DELAY_MS = 2500; 

    // 2. CONTEXT CHECK
    if (window.self === window.top) {
        return; // Exit if we are on the main Moodle page
    }

    console.log("[UMP Auto-Next] Iframe detected. Initializing...");

    let observer = null;
    let clickTimer = null;

    /**
     * Simulates a real human mouse click sequence.
     * This is safer than .click() for complex apps like Articulate.
     */
    function triggerHumanClick(element) {
        const eventOptions = {
            bubbles: true,
            cancelable: true,
            view: window
        };

        // Dispatch sequence: MouseDown -> MouseUp -> Click
        element.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        element.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        element.click(); 
    }

    /**
     * Logic to decide if we should click.
     */
    function tryClick(btn) {
        // 1. Check if visually disabled
        const hasDisabledClass = btn.classList.contains(DISABLED_CLASS);
        
        // 2. Check accessibility attribute (sometimes it's "true", sometimes missing)
        const ariaDisabled = btn.getAttribute('aria-disabled') === 'true';

        // 3. Check if actually visible (prevent clicking hidden buttons)
        const style = window.getComputedStyle(btn);
        const isHidden = style.display === 'none' || style.visibility === 'hidden';

        if (!hasDisabledClass && !ariaDisabled && !isHidden) {
            
            // Debounce: Reset timer if this function is called repeatedly
            if (clickTimer) clearTimeout(clickTimer);

            console.log(`[UMP Auto-Next] Button enabled. Waiting ${CLICK_DELAY_MS}ms for player to settle...`);

            clickTimer = setTimeout(() => {
                console.log("[UMP Auto-Next] >> EXECUTING CLICK <<");
                triggerHumanClick(btn);
            }, CLICK_DELAY_MS);
            
        } else {
            // Button is disabled or hidden, cancel any pending clicks
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
                // console.log("[UMP Auto-Next] Button disabled/hidden. Click cancelled.");
            }
        }
    }

    /**
     * Attach the observer to watch for state changes.
     */
    function attachObserver(btn) {
        if (observer) observer.disconnect();
        console.log("[UMP Auto-Next] Observer attached to #next button.");

        // Initial check
        tryClick(btn);

        observer = new MutationObserver((mutations) => {
            // We only care about class or aria changes
            // We verify the state regardless of which specific attribute changed
            tryClick(btn);
        });

        observer.observe(btn, {
            attributes: true,
            attributeFilter: ['class', 'aria-disabled', 'style']
        });
    }

    /**
     * Init Loop: Scans for the button every 1 second until found.
     */
    const initInterval = setInterval(() => {
        const btn = document.querySelector(BUTTON_SELECTOR);
        if (btn) {
            clearInterval(initInterval);
            attachObserver(btn);
        }
    }, 1000);

})();
