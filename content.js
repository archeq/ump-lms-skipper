(function() {
    'use strict';

    // --- PART 1: THE NUCLEAR AUTOPLAY BYPASS ---
    // This overrides the browser's native play() function.
    // It forces EVERY video/audio to mute itself before playing.
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() {
        this.muted = true; // FORCE MUTE
        this.volume = 0;   // FORCE SILENCE
        return originalPlay.apply(this, arguments);
    };

    console.log("[UMP Nuclear] Video player override active. Autoplay enabled.");

    // --- PART 2: CONFIGURATION ---
    const CONTAINER_SELECTOR = '.component_container.next'; 
    const LOCKED_CLASS = 'disabled';
    const POLLING_INTERVAL = 1000; 

    // --- PART 3: CONTEXT CHECK ---
    if (window.self === window.top) return;

    console.log("[UMP Nuclear] Iframe active. Hunting for Next Container...");

    // --- HELPER: SIMULATE INTERACTION ---
    // Mimics a human moving the mouse over the button and clicking
    function simulateInteraction(element) {
        const events = [
            new MouseEvent('mouseover', { bubbles: true, view: window }),
            new MouseEvent('mouseenter', { bubbles: true, view: window }),
            new MouseEvent('mousedown', { bubbles: true, view: window }),
            new MouseEvent('mouseup', { bubbles: true, view: window }),
            new MouseEvent('click', { bubbles: true, view: window })
        ];
        
        events.forEach(evt => element.dispatchEvent(evt));
    }

    // --- HELPER: ENSURE PROGRESS ---
    // Sometimes the player pauses even after our override. This kicks it.
    function kickstartMedia() {
        document.querySelectorAll('video, audio').forEach(media => {
            if (media.paused && media.readyState > 2) {
                // console.log("[UMP Nuclear] Kicking stuck video...");
                media.play().catch(e => {}); // Ignore errors, our override handles most
            }
        });
    }

    // --- MAIN ENGINE ---
    let isCoolingDown = false;

    setInterval(() => {
        // 1. Keep videos moving
        kickstartMedia();

        if (isCoolingDown) return;

        // 2. Find the target container
        const container = document.querySelector(CONTAINER_SELECTOR);

        if (container) {
            // 3. Check Lock State
            const isLocked = container.classList.contains(LOCKED_CLASS);
            const isVisible = container.offsetParent !== null;

            if (!isLocked && isVisible) {
                console.log("[UMP Nuclear] Target Unlocked! Engaging...");

                // Visual Feedback: Hot Pink Border
                const oldBorder = container.style.border;
                container.style.border = "5px solid #ff00ff"; 

                // 4. EXECUTE: Hover & Click the CONTAINER
                simulateInteraction(container);

                // 5. EXECUTE: Hover & Click the BUTTON (just in case)
                const childBtn = container.querySelector('button');
                if (childBtn) simulateInteraction(childBtn);

                // Cooldown: Stop clicking for 3 seconds to let the next slide load
                isCoolingDown = true;
                setTimeout(() => {
                    if(container) container.style.border = oldBorder;
                    isCoolingDown = false;
                }, 3000); 
            }
        } 
    }, POLLING_INTERVAL);

})();
