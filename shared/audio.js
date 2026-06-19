const AudioSystem = (function() {
    let audioCtx = null;
    let isStandMode = false;
    let initialized = false;

    
    function init() {
        if (initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
                initialized = true;
            }
        } catch (e) {
            console.warn("AudioContext not supported or disabled");
        }
    }
    if (typeof window !== 'undefined') {
        window.addEventListener('click', init, { once: true });
        window.addEventListener('touchstart', init, { once: true });
    }

    function setStandMode(standMode) {
        isStandMode = standMode;
    }

    function playTone(freq1, freq2, type, duration, vol) {
        init();
        if (!audioCtx || audioCtx.state === 'suspended') {
            try { audioCtx.resume(); } catch(e) {}
            if (!audioCtx || audioCtx.state === 'suspended') return;
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        
        if (isStandMode) {
            oscillator.type = type === 'sine' ? 'triangle' : 'sawtooth';
            freq1 = freq1 * 0.5;
            if (freq2) freq2 = freq2 * 0.5;
            vol = vol * 2.0; 
        } else {
            oscillator.type = type;
        }

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.frequency.setValueAtTime(freq1, now);
        if (freq2) {
            oscillator.frequency.exponentialRampToValueAtTime(freq2, now + duration - 0.05);
        }

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    return {
        setStandMode,
        init,
        play: function(event) {
            switch(event) {
                case 'join':
                    
                    playTone(440, 880, 'sine', 0.3, 0.1);
                    break;
                case 'leave':
                    
                    playTone(300, 150, 'sine', 0.4, 0.1);
                    break;
                case 'chat':
                    
                    playTone(600, null, 'sine', 0.15, 0.1);
                    setTimeout(() => playTone(800, null, 'sine', 0.15, 0.1), 100);
                    break;
                case 'zone':
                    
                    playTone(500, null, 'square', 0.1, 0.05);
                    setTimeout(() => playTone(500, null, 'square', 0.1, 0.05), 150);
                    break;
                case 'broadcast':
                    
                    playTone(400, 600, 'triangle', 0.8, 0.2);
                    break;
            }
        }
    };
})();

if (typeof window !== 'undefined') {
    window.AudioSystem = AudioSystem;
}
