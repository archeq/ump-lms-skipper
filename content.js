(function() {
    'use strict';

    // --- CONFIGURATION ---
    const TIME_SELECTOR = '.label.time';       // Where the "01:20 / 01:25" text lives
    const NEXT_SELECTOR = '.component_container.next'; // The container to click
    const POLLING_INTERVAL = 1000;             // Check every 1 second

    // --- CONTEXT CHECK ---
    if (window.self === window.top) return;

    // --- HELPER: PARSE "MM:SS" TO SECONDS ---
    function parseSeconds(timeStr) {
        if (!timeStr) return 0;
        // Clean up string (remove spaces, etc)
        timeStr = timeStr.trim();
        const parts = timeStr.split(':').map(Number);
        
        if (parts.length === 2) {
            return (parts[0] * 60) + parts[1]; // MM:SS
        } else if (parts.length === 3) {
            return (parts[0] * 3600) + (parts[1] * 60) + parts[2]; // HH:MM:SS
        }
        return 0;
    }

    // --- HELPER: SAFE CLICKER ---
    function triggerClick(element) {
        console.log("[UMP Reader] Time match! Clicking Next...");
        
        // Visual Feedback (Green Flash)
        element.style.border = "5px solid #00ff00"; 

        // Send Hover + Click events to the container (div)
        // This avoids the "child.click" error by not touching the SVG
        const events = ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'];
        events.forEach(type => {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true, 
                cancelable: true, 
                view: window
            }));
        });

        // Also try clicking the specific button element if it exists
        // (The button sibling next to the svg, usually class 'component_base')
        const actualButton = element.querySelector('button');
        if (actualButton) actualButton.click();
    }

    // --- HELPER: MEDIA KICKSTARTER ---
    // Ensures the timer actually moves by forcing the video to play
    function keepTimerMoving() {
        const mediaElements = document.querySelectorAll('video, audio');
        mediaElements.forEach(media => {
            if (!media.muted) media.muted = true; // Essential for autoplay
            if (media.paused && media.readyState > 2) {
                media.play().catch(e => {}); 
            }
        });
    }

    // --- MAIN ENGINE ---
    let isCoolingDown = false;

    setInterval(() => {
        // 1. Keep the video playing so the text updates
        keepTimerMoving();

        if (isCoolingDown) return;

        // 2. Find the elements
        const timeLabel = document.querySelector(TIME_SELECTOR);
        const nextBtn = document.querySelector(NEXT_SELECTOR);

        if (timeLabel && nextBtn) {
            
            // 3. Parse the text "01:20 / 01:25"
            const text = timeLabel.innerText || ""; // e.g. "01:20 / 01:25"
            const times = text.split('/');

            if (times.length === 2) {
                const currentSec = parseSeconds(times[0]);
                const totalSec = parseSeconds(times[1]);

                // 4. Compare
                // We allow a 1-second buffer in case the timer stops at 01:24 / 01:25
                const isFinished = currentSec >= (totalSec - 1); 

                if (isFinished) {
                    // FINISHED: Click!
                    triggerClick(nextBtn);
                    
                    // Cooldown logic
                    isCoolingDown = true;
                    setTimeout(() => {
                        if(nextBtn) nextBtn.style.border = "";
                        isCoolingDown = false;
                    }, 4000); 

                } else {
                    // STILL PLAYING: Wait.
                    // console.log(`[UMP Reader] Waiting... ${currentSec} / ${totalSec}`);
                    nextBtn.style.border = "3px solid #FFFF00"; // Yellow = Watching
                }
            }
        }
    }, POLLING_INTERVAL);

})();
