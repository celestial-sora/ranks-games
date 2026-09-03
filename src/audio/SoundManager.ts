/**
 * Elegant acoustic sound synthesizer using Web Audio API
 * Crafted for a warm, soothing, luxury acoustic feel (celesta, bell chimes, warm marimba)
 */
export class SoundManager {
  private static instance: SoundManager;
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private constructor() {}

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private getContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Helper: Play a warm chime with fundamental + subtle overtone
   */
  private playBell(freq: number, duration: number = 0.4, gainLevel: number = 0.12) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Fundamental Tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(gainLevel, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Subtle Harmonic Overtone (octave + 5th for crystal sheen)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, now);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.exponentialRampToValueAtTime(gainLevel * 0.25, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + duration);
    osc2.start(now);
    osc2.stop(now + duration);
  }

  /**
   * Delicate, soothing celesta chime on lane shift
   */
  public playLaneShift() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [659.25, 783.99]; // E5 -> G5 soft harp pluck
    const now = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0.001, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.08, now + i * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.22);
    });
  }

  /**
   * Warm acoustic wood thud / soft filtered impact on taking damage
   */
  public playHit() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub resonance
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Ethereal warm chime on countdown
   */
  public playCountdown(isFinal: boolean = false) {
    if (isFinal) {
      this.playBell(880, 0.7, 0.18); // A5 pure bell
    } else {
      this.playBell(587.33, 0.45, 0.14); // D5 pure bell
    }
  }

  /**
   * Soft, reflective warm ambient chord on Game Over
   */
  public playGameOver() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [392.00, 329.63, 261.63, 196.00]; // G4, E4, C4, G3 gentle descent

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.14;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.8);
    });
  }

  /**
   * Celestial Major 9th Arpeggio on Victory
   */
  public playVictory() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Cmaj9 arpeggio: C5, E5, G5, B5, D6, G6
    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.11;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.16, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.9);
    });
  }
}
