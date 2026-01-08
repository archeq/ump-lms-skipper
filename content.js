(function() {
    'use strict';

    const BUTTON_SELECTOR = '#next';
    const CLICK_DELAY_MS = 500;
    let hasClicked = false; // Guard flag to prevent multiple clicks

    /**
     * Actually performs the click action.
     * @param {HTMLElement} btn 
     */
    function executeClick(btn) {
        if (hasClicked) return;
        
        console.log("[Auto-Next] Button enabled. clicking in", CLICK_DELAY_MS, "ms...");
        hasClicked = true;

        setTimeout(() => {
            console.log("[Auto-Next] Clicking now.");
            btn.click();
        }, CLICK_DELAY_MS);
    }

    /**
     * Checks the button's attributes against the logic criteria.
     * Logic: IF class 'cs-disabled' is removed AND aria-disabled != 'true'
     * @param {HTMLElement} btn 
     */
    function checkButtonState(btn) {
        const isCsDisabled = btn.classList.contains('cs-disabled');
        const isAriaDisabled = btn.getAttribute('aria-disabled') === 'true';

        // Debugging log (optional, remove in production)
        // console.log(`[Auto-Next] State Check -> cs-disabled: ${isCsDisabled}, aria-disabled: ${isAriaDisabled}`);

        if (!isCsDisabled && !isAriaDisabled) {
            executeClick(btn);
        }
    }

    /**
     * Main entry point. Finds the button and attaches the observer.
     */
    function initObserver() {
        const nextButton = document.querySelector(BUTTON_SELECTOR);

        // 1. Safety check: Does the button exist yet?
        if (!nextButton) {
            console.log("[Auto-Next] Button #next not found yet. Retrying in 1s...");
            // Simple polling fallback if the UI is slow to render
            setTimeout(initObserver, 1000); 
            return;
        }

        console.log("[Auto-Next] Button found. Observer starting.");

        // 2. Initial check: Is it already enabled? (e.g. page reload)
        checkButtonState(nextButton);

        // 3. Setup MutationObserver
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    checkButtonState(nextButton);
                }
            });
        });

        // 4. Start observing specific attributes
        observer.observe(nextButton, {
            attributes: true,
            attributeFilter: ['class', 'aria-disabled'] 
        });
    }

    // Start the script
    initObserver();

})();
