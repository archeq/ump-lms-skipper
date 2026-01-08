(function() {
    'use strict';

    // --- CONFIGURATION ---
    // Targeted specifically at the HTML structure from your screenshot
    const CONTAINER_SELECTOR = '.component_container.next'; 
    const BUTTON_SELECTOR = '.component_base.next';
    
    // The class Moodle/iSpring adds when the button is locked
    const DISABLED_CLASS = 'disabled';
    
    // Check every 1 second
    const POLLING_INTERVAL = 1000; 

    // --- CONTEXT CHECK ---
    // Only run inside the iframe
    if (window.self === window.top) return;

    console.log("[UMP Final] Iframe active. Hunting for .component_container.next ...");

    // --- HELPER: CLICKER ---
    function triggerClick(element) {
        // Create a full set of events to fool the player
        ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
            const event = new MouseEvent(eventType, {
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(event);
        });
    }

    // --- HELPER: AUTOPLAY FIX ---
    // Keeps the video moving so the "Next" button eventually unlocks
    function keepMediaPlaying() {
        const mediaElements = document.querySelectorAll('video, audio');
        mediaElements.forEach(media => {
            if (!media.muted) media.muted = true; // Essential for Chrome autoplay
            if (media.paused) media.play().catch(() => {}); 
        });
    }

    // --- MAIN ENGINE ---
    let isCoolingDown = false;

    setInterval(() => {
        // 1. Keep video alive
        keepMediaPlaying();

        if (isCoolingDown) return;

        // 2. Find the container (parent) and the button (child)
        const container = document.querySelector(CONTAINER_SELECTOR);
        const button = document.querySelector(BUTTON_SELECTOR);

        if (container && button) {
            
            // 3. Check if locked
            // Based on your screenshot, the class 'disabled' is on the PARENT container
            const isLocked = container.classList.contains(DISABLED_CLASS);
            const isHidden = container.offsetParent === null; // standard visibility check

            if (!isLocked && !isHidden) {
                console.log("[UMP Final] Button UNLOCKED. Clicking...");

                // Visual Feedback
                const oldBorder = container.style.border;
                container.style.border = "4px solid #00ff00"; // Green Box

                // Click!
                triggerClick(button);

                // Cooldown to prevent double-clicking while slide loads
                isCoolingDown = true;
                setTimeout(() => {
                    container.style.border = oldBorder;
                    isCoolingDown = false;
                }, 3000); // 3 second pause
            }
        } 
    }, POLLING_INTERVAL);

})();
