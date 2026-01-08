(function() {
    'use strict';

    // --- CONFIGURATION ---
    // We scan for ALL these potential selectors. 
    // This covers Articulate Storyline, Rise, Captivate, and Polish labels.
    const POTENTIAL_SELECTORS = [
        '#next',                          // Standard Articulate
        '#linkNext',                      // Older Articulate / Captivate
        'div.next-button',                // Generic
        'button[aria-label="Next"]',      // Accessibility English
        'button[aria-label="Dalej"]',     // Accessibility Polish
        'button[title="Next"]',           // Title attribute English
        'button[title="Dalej"]',          // Title attribute Polish
        '.cs-next',                       // Class-based
        '#mobile-next-button'             // Mobile views
    ];

    const DISABLED_CLASSES = ['cs-disabled', 'disabled', 'btn-disabled'];
    const CLICK_DELAY_MS = 2500; // Delay to prevent crashing the player

    // --- CONTEXT CHECK ---
    if (window.self === window.top) {
        // We are on the main Moodle page. 
        // We do NOT want to run here, we want to run inside the iframe.
        return; 
    }

    console.log("[UMP Auto-Next] Iframe active. Scanning for navigation controls...");

    let observer = null;
    let clickTimer = null;
    let targetButton = null;

    /**
     * Helper: Simulates a human click (MouseDown -> MouseUp -> Click)
     */
    function triggerHumanClick(element) {
        const eventOptions = { bubbles: true, cancelable: true, view: window };
        element.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        element.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        element.click(); 
    }

    /**
     * Logic: Check if the button is ready to be clicked
     */
    function tryClick(btn) {
        // 1. Check classes
        const hasDisabledClass = DISABLED_CLASSES.some(cls => btn.classList.contains(cls));
        
        // 2. Check accessibility (aria-disabled="true")
        const ariaDisabled = btn.getAttribute('aria-disabled') === 'true';

        // 3. Check visibility
        const style = window.getComputedStyle(btn);
        const isHidden = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';

        if (!hasDisabledClass && !ariaDisabled && !isHidden) {
            
            // Debounce
            if (clickTimer) clearTimeout(clickTimer);

            console.log(`[UMP Auto-Next] Button enabled. Waiting ${CLICK_DELAY_MS}ms...`);

            // Visual feedback: Turn the button Green so you know the script found it
            btn.style.border = "3px solid #00ff00"; 

            clickTimer = setTimeout(() => {
                console.log("[UMP Auto-Next] >> EXECUTING CLICK <<");
                triggerHumanClick(btn);
                btn.style.border = ""; // Reset border
            }, CLICK_DELAY_MS);
            
        } else {
            // Button is disabled/hidden
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
            }
            // Visual feedback: Turn the button Red so you know the script sees it but knows it's locked
            // btn.style.border = "2px solid red"; 
        }
    }

    /**
     * Attach MutationObserver to the found button
     */
    function attachObserver(btn) {
        if (observer) observer.disconnect();
        
        targetButton = btn;
        console.log("[UMP Auto-Next] LOCKED ON TARGET:", btn);
        
        // Visual indicator that we found the button
        btn.style.boxShadow = "0 0 10px #00ff00"; 

        // Initial check
        tryClick(btn);

        observer = new MutationObserver((mutations) => {
            tryClick(btn);
        });

        observer.observe(btn, {
            attributes: true,
            attributeFilter: ['class', 'aria-disabled', 'style', 'disabled']
        });
    }

    /**
     * Scanner: Runs repeatedly to find ANY matching button from our list
     */
    const initInterval = setInterval(() => {
        // Stop scanning if we already attached the observer to a valid button
        if (targetButton && document.contains(targetButton)) return;

        let foundBtn = null;

        // Loop through our list of selectors
        for (let selector of POTENTIAL_SELECTORS) {
            const candidate = document.querySelector(selector);
            if (candidate) {
                foundBtn = candidate;
                console.log(`[UMP Auto-Next] Match found using selector: ${selector}`);
                break; // Stop looking, we found one
            }
        }

        if (foundBtn) {
            // Found it! Stop the interval and attach logic.
            clearInterval(initInterval);
            attachObserver(foundBtn);
        }
    }, 1000); // Scan every second

})();
