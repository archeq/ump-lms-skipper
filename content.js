(function() {
    'use strict';

    // --- CONFIGURATION ---
    const TARGET_TEXTS = ["NASTĘPNY", "DALEJ", "NEXT"];
    const POLLING_INTERVAL = 1000;

    // --- HELPER: MEDIA SKIPPER ---
    // Cheats the video by setting time to the end
    function skipMedia() {
        const mediaElements = document.querySelectorAll('video, audio');
        mediaElements.forEach(media => {
            if (!media.muted) media.muted = true; 
            if (media.duration && !isNaN(media.duration)) {
                if (media.currentTime < media.duration - 0.5) {
                    // console.log("[UMP Search] Skipping media...");
                    try { media.currentTime = media.duration; } catch (e) {}
                }
            }
        });
    }

    // --- HELPER: FORCE CLICK ---
    function forceClick(element) {
        console.log("[UMP Search] CLICKING:", element);
        
        // 1. Visual Feedback (Orange Border)
        element.style.border = "5px solid #FFA500"; 
        element.style.boxShadow = "0 0 10px #FFA500";

        // 2. Unlock
        element.classList.remove('disabled');
        element.removeAttribute('disabled');

        // 3. Click Sequence
        const events = ['mouseover', 'mousedown', 'mouseup', 'click'];
        events.forEach(type => {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true, cancelable: true, view: window
            }));
        });

        // 4. Click children too (often the button is inside the div)
        const children = element.querySelectorAll('*');
        children.forEach(child => child.click());
    }

    // --- MAIN SEARCH LOGIC ---
    function scanAndClick() {
        skipMedia();

        // Strategy A: Find by specific iSpring Class (from your screenshot)
        // We look for the button, not just the container
        const buttons = document.querySelectorAll('.component_container.next, .component_base.next');
        
        for (let btn of buttons) {
            if (btn.offsetParent !== null) { // Is it visible?
                forceClick(btn);
                return; // Stop after clicking
            }
        }

        // Strategy B: Text Search (Fallback)
        // Looks for ANY button/div containing "NASTĘPNY"
        const allDivs = document.querySelectorAll('div, button, span');
        for (let el of allDivs) {
            // Check if element has our target text and is visible
            if (el.innerText && TARGET_TEXTS.includes(el.innerText.trim().toUpperCase())) {
                if (el.offsetParent !== null && el.tagName !== 'SCRIPT') {
                    // Start climbing up to find the clickable parent container
                    let clickable = el;
                    while (clickable && !clickable.classList.contains('component_container') && clickable !== document.body) {
                        clickable = clickable.parentElement;
                    }
                    
                    if (clickable && clickable !== document.body) {
                        forceClick(clickable);
                        return;
                    } else {
                        // If no container found, click the text element itself
                        forceClick(el);
                        return;
                    }
                }
            }
        }
    }

    // --- INIT ---
    // Run this logic in every frame
    console.log("[UMP Search] Active in frame:", window.location.href);
    setInterval(scanAndClick, POLLING_INTERVAL);

})();
