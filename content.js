(function() {
    'use strict';

    // --- CONFIGURATION ---
    // We target the DIV container because that's where the classes change
    const CONTAINER_SELECTOR = '.component_container.next'; 
    const LOCKED_CLASS = 'disabled';
    
    // Check every 1 second
    const POLLING_INTERVAL = 1000; 

    // --- CONTEXT CHECK ---
    if (window.self === window.top) return;

    console.log("[UMP Final] Iframe active. Targeting Container...");

    // --- HELPER: CLICK SEQUENCE ---
    function simulateInteraction(element) {
        // 1. Hover first (Crucial based on your finding)
        element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, view: window }));
        element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, view: window }));
        
        // 2. The Click Sequence
        const clickEvents = ['mousedown', 'mouseup', 'click'];
        clickEvents.forEach(type => {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window
            }));
        });
    }

    // --- HELPER: AUTOPLAY FIX ---
    function keepMediaPlaying() {
        document.querySelectorAll('video, audio').forEach(media => {
            if (!media.muted) media.muted = true;
            if (media.paused) media.play().catch(() => {}); 
        });
    }

    // --- MAIN ENGINE ---
    let isCoolingDown = false;

    setInterval(() => {
        keepMediaPlaying();

        if (isCoolingDown) return;

        const container = document.querySelector(CONTAINER_SELECTOR);

        if (container) {
            // Logic: Click if the 'disabled' class is MISSING
            const isLocked = container.classList.contains(LOCKED_CLASS);
            
            // Safety: Ensure it's actually visible on screen
            const isVisible = container.offsetParent !== null;

            if (!isLocked && isVisible) {
                console.log("[UMP Final] Target Unlocked. Engaging...");

                // Visual Feedback: Hot Pink Border on the Container
                const oldBorder = container.style.border;
                container.style.border = "4px solid #ff00ff"; 

                // Execute Click on the CONTAINER (the div)
                simulateInteraction(container);

                // Also try clicking the button inside, just in case
                const childBtn = container.querySelector('button');
                if(childBtn) simulateInteraction(childBtn);

                // Cooldown
                isCoolingDown = true;
                setTimeout(() => {
                    container.style.border = oldBorder;
                    isCoolingDown = false;
                }, 3000); 
            }
        } 
    }, POLLING_INTERVAL);

})();
