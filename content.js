(function() {
    'use strict';

    const BUTTON_SELECTOR = '#next';
    const CLICK_DELAY_MS = 500;
    let hasClicked = false;

    // Helper to identify which frame we are logging from
    const contextName = window.self === window.top ? "[Top Frame]" : "[Iframe]";

    function executeClick(btn) {
        if (hasClicked) return;
        
        console.log(`${contextName} [Auto-Next] Target acquired. Clicking in ${CLICK_DELAY_MS}ms...`);
        hasClicked = true;

        setTimeout(() => {
            btn.click();
            console.log(`${contextName} [Auto-Next] CLICK COMMAND SENT.`);
        }, CLICK_DELAY_MS);
    }

    function checkButtonState(btn) {
        // 1. Check for disabled class
        const isCsDisabled = btn.classList.contains('cs-disabled');
        
        // 2. Check for aria-disabled (it might be "true", "false", or null/missing)
        const ariaAttr = btn.getAttribute('aria-disabled');
        const isAriaDisabled = ariaAttr === 'true';

        // Debug logic to see what the script sees
        // console.log(`${contextName} Checking: cs-disabled=${isCsDisabled}, aria-disabled=${ariaAttr}`);

        // IF NO 'cs-disabled' class AND 'aria-disabled' is NOT true -> CLICK
        if (!isCsDisabled && !isAriaDisabled) {
            executeClick(btn);
        }
    }

    function initObserver() {
        const nextButton = document.querySelector(BUTTON_SELECTOR);

        if (!nextButton) {
            // Silence the "not found" log if we are in the wrong frame 
            // to avoid spamming the console from unrelated iframes.
            return; 
        }

        console.log(`${contextName} [Auto-Next] Button found! Starting observer.`);

        // Check immediately in case it loaded explicitly enabled
        checkButtonState(nextButton);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    checkButtonState(nextButton);
                }
            });
        });

        observer.observe(nextButton, {
            attributes: true,
            attributeFilter: ['class', 'aria-disabled', 'style'] // Added style just in case display changes
        });
    }

    // Initialize
    // We use a slight delay to allow the iframe content to paint
    setTimeout(initObserver, 1500);

})();
