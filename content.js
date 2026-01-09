(function() {
    'use strict';

    // --- CONFIGURATION ---
    const POLLING_INTERVAL = 1000; // Check every 1s
    const PLAYBACK_SPEED = 1.0;    // Set to 1.5 or 2.0 if you want to watch faster
    const TIME_THRESHOLD = 0.5;    // Click when within 0.5s of the end

    // --- HELPER: MANAGE VIDEO ---
    function checkMediaStatus() {
        const mediaElements = document.querySelectorAll('video, audio');
        let isPlaying = false;
        let isFinished = true; // Assume finished unless we find an active video

        mediaElements.forEach(media => {
            // 1. Ensure muted (for browser autoplay) & set speed
            if (!media.muted) media.muted = true;
            if (media.playbackRate !== PLAYBACK_SPEED) media.playbackRate = PLAYBACK_SPEED;

            // 2. Check if this media has a real duration
            if (media.duration && !isNaN(media.duration) && media.duration > 1) {
                // We found meaningful media
                isPlaying = true;

                // 3. Kickstart if paused
                if (media.paused && media.readyState > 2) {
                    media.play().catch(e => {}); 
                }

                // 4. CHECK TIME: Are we at the end?
                const timeLeft = media.duration - media.currentTime;
                // console.log(`[UMP Time] Time Left: ${timeLeft.toFixed(1)}s`);

                if (timeLeft > TIME_THRESHOLD) {
                    isFinished = false; // Still watching!
                }
            }
        });

        // Returns object: { hasMedia: boolean, readyToAdvance: boolean }
        return { 
            hasMedia: isPlaying, 
            readyToAdvance: isFinished 
        };
    }

    // --- HELPER: CLICKER ---
    function clickNext(element) {
        console.log("[UMP Time] Slide Complete. Clicking...");
        
        // Visual Feedback (Green Flash)
        element.style.border = "5px solid #00ff00"; 

        // Send Click Events
        const events = ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'];
        events.forEach(type => {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true, cancelable: true, view: window
            }));
        });

        // Click the internal button if accessible
        const actualBtn = element.querySelector('button');
        if (actualBtn) actualBtn.click();
    }

    // --- MAIN ENGINE ---
    let isCoolingDown = false;

    setInterval(() => {
        if (isCoolingDown) return;

        // 1. Find the Next Button Container
        const target = document.querySelector('.component_container.next');

        if (target && target.offsetParent !== null) {
            
            // 2. Check the Video Status
            const status = checkMediaStatus();

            if (status.hasMedia && !status.readyToAdvance) {
                // CASE A: Video is playing. WAIT.
                target.style.border = "4px solid #FFFF00"; // Yellow = Waiting for timer
                // console.log("[UMP Time] Waiting for video...");
            
            } else {
                // CASE B: Video finished OR No video on this slide. CLICK.
                
                // Double check we haven't already clicked
                if (!isCoolingDown) {
                    clickNext(target);
                    
                    // Cooldown logic
                    isCoolingDown = true;
                    setTimeout(() => {
                        if(target) target.style.border = "";
                        isCoolingDown = false;
                    }, 4000); // Wait 4s for next slide
                }
            }
        } 
    }, POLLING_INTERVAL);

})();
