class SoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;
      
      // Resume context if suspended
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn("Web Audio API no soportada", e);
    }
  }

  _playTone(freq, type, duration, vol = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playPop() {
    if (!this.ctx) return;
    // A quick low-frequency sine wave for a "pop" or "click"
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playGlobalChat() {
    if (!this.ctx) return;
    // Ascending dual tone
    this._playTone(440, 'sine', 0.15, 0.1); // A4
    setTimeout(() => this._playTone(554.37, 'sine', 0.3, 0.1), 150); // C#5
  }

  playZoneChat() {
    if (!this.ctx) return;
    // Lower, warmer tone
    this._playTone(349.23, 'sine', 0.15, 0.1); // F4
    setTimeout(() => this._playTone(440, 'sine', 0.3, 0.1), 150); // A4
  }

  playPrivateChat() {
    if (!this.ctx) return;
    // Quick, higher pitched attention grabber
    this._playTone(659.25, 'sine', 0.1, 0.1); // E5
    setTimeout(() => this._playTone(880, 'sine', 0.2, 0.1), 100); // A5
  }

  playSocial() {
    if (!this.ctx) return;
    // Soft descending chime for social feed
    this._playTone(523.25, 'sine', 0.15, 0.1); // C5
    setTimeout(() => this._playTone(392.00, 'sine', 0.3, 0.1), 150); // G4
  }

  playJoin() {
    if (!this.ctx) return;
    // Ascending chord arpeggio
    this._playTone(261.63, 'sine', 0.2, 0.05); // C4
    setTimeout(() => this._playTone(329.63, 'sine', 0.2, 0.05), 100); // E4
    setTimeout(() => this._playTone(392.00, 'sine', 0.4, 0.05), 200); // G4
  }

  playAlert() {
    if (!this.ctx) return;
    // Sharp triangle wave beep
    this._playTone(880, 'triangle', 0.1, 0.15); // A5
    setTimeout(() => this._playTone(880, 'triangle', 0.2, 0.15), 150);
  }
}

export default new SoundEngine();
