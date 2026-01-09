(function() {
    'use strict';

    // --- CONFIGURATION ---
    const TIME_SELECTOR = '.label.time';       
    const NEXT_SELECTOR = '.component_container.next'; 
    const POLLING_INTERVAL = 1000;             

    // --- CONTEXT CHECK ---
    if (window.self === window.top) return;

    // --- HELPER: TIME PARSER ---
    function parseSeconds(timeStr) {
        if (!timeStr) return 0;
        timeStr = timeStr.trim();
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return (parts[0] * 60) + parts[1];
        if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        return 0;
    }

    // --- HELPER: CLICKER (FIXED) ---
    function triggerClick(element) {
        console.log("[UMP Fix] Clicking ONCE...");
        
        // Visual Feedback
        element.style.border = "5px solid #00ff00"; 

        // Send interaction events ONLY to the container
        // We removed the secondary 'button.click()' to prevent double-skipping
        const events = ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'];
        events.forEach(type => {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true, 
                cancelable: true, 
                view: window
            }));
        });
    }

    // --- HELPER: KICKSTART VIDEO ---
    function keepTimerMoving() {
        const mediaElements = document.querySelectorAll('video, audio');
        mediaElements.forEach(media => {
            if (!media.muted) media.muted = true;
            if (media.paused && media.readyState > 2) {
                media.play().catch(e => {}); 
            }
        });
    }

    // --- MAIN ENGINE ---
    let isCoolingDown = false;

    setInterval(() => {
        keepTimerMoving();

        if (isCoolingDown) return;

        const timeLabel = document.querySelector(TIME_SELECTOR);
        const nextBtn = document.querySelector(NEXT_SELECTOR);

        if (timeLabel && nextBtn) {
            
            const text = timeLabel.innerText || "";
            const times = text.split('/');

            if (times.length === 2) {
                const currentSec = parseSeconds(times[0]);
                const totalSec = parseSeconds(times[1]);

                // Check if finished (allow 1s buffer)
                const isFinished = currentSec >= (totalSec - 1); 

                if (isFinished) {
                    // CLICK!
                    triggerClick(nextBtn);
                    
                    // Activate Cooldown to prevent spamming
                    isCoolingDown = true;
                    
                    // Wait 4 seconds before looking for the next slide
                    setTimeout(() => {
                        if(nextBtn) nextBtn.style.border = "";
                        isCoolingDown = false;
                    }, 4000); 

                } else {
                    // WAIT
                    nextBtn.style.border = "3px solid #FFFF00"; 
                }
            }
        }
    }, POLLING_INTERVAL);

})();
