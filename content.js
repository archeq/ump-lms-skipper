(function() {
    'use strict';

    // 1. CONFIGURATION
    // The specific selector for Articulate Storyline 'Next' buttons
    const BUTTON_SELECTOR = '#next'; 
    // The class that marks the button as disabled
    const DISABLED_CLASS = 'cs-disabled';
    
    // 2. CONTEXT CHECK
    // We only want to run this inside the iframe where the player lives.
    // We check if we are NOT in the top frame (meaning we are inside an iframe).
    if (window.self === window.top) {
        // We are on the main Moodle page. Do nothing here.
        return;
    }

    console.log("[UMP Auto-Next] Iframe detected. Scanning for video player...");

    let observer = null;
    let clickTimer = null;

    /**
     * Clicks the button if it is enabled.
     */
    function tryClick(btn) {
        const isDisabled = btn.classList.contains(DISABLED_CLASS) || btn.getAttribute('aria-disabled') === 'true';

        if (!isDisabled) {
            console.log("[UMP Auto-Next] Button is ENABLED. Clicking in 1 second...");
            
            // Debounce: Clear previous timer if it exists to avoid double clicks
            if (clickTimer) clearTimeout(clickTimer);

            clickTimer = setTimeout(() => {
                console.log("[UMP Auto-Next] >> CLICK <<");
                btn.click();
            }, 1000); // 1 second delay to be safe
        } else {
            // console.log("[UMP Auto-Next] Button is still locked...");
        }
    }

    /**
     * Sets up the MutationObserver to watch the button for changes.
     */
    function attachObserver(btn) {
        if (observer) observer.disconnect();

        console.log("[UMP Auto-Next] Target button found. Observer attached.");
        
        // Check immediately in case it loaded enabled
        tryClick(btn);

        observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'aria-disabled')) {
                    tryClick(btn);
                }
            });
        });

        observer.observe(btn, {
            attributes: true
        });
    }

    /**
     * Initialization Loop
     * Articulate players take a few seconds to load React/Angular content.
     * We poll every 1 second until we find the button.
     */
    const initInterval = setInterval(() => {
        const btn = document.querySelector(BUTTON_SELECTOR);
        
        if (btn) {
            clearInterval(initInterval);
            attachObserver(btn);
        }
    }, 1000);

})();
