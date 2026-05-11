/** Simple synth SFX with a hard cap on concurrent voices (PRD). */
const MAX_VOICES = 8;
let activeVoices = 0;

function beep(
  ctx: AudioContext,
  freq: number,
  dur: number,
  type: OscillatorType,
  gain: number,
): void {
  if (activeVoices >= MAX_VOICES) return;
  activeVoices++;
  const now = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(now);
  o.stop(now + dur + 0.02);
  window.setTimeout(() => {
    activeVoices = Math.max(0, activeVoices - 1);
  }, Math.ceil((dur + 0.05) * 1000));
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  resume(): void {
    if (!this.ctx) this.ctx = new AudioContext();
    void this.ctx.resume();
  }

  shoot(): void {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;
    beep(this.ctx, 880, 0.04, 'square', 0.06);
  }

  hit(): void {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;
    beep(this.ctx, 140, 0.12, 'sawtooth', 0.12);
  }

  shieldBreak(): void {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;
    beep(this.ctx, 520, 0.1, 'triangle', 0.1);
  }

  pickup(): void {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;
    beep(this.ctx, 660, 0.08, 'sine', 0.08);
  }

  menu(): void {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;
    beep(this.ctx, 440, 0.05, 'square', 0.05);
  }
}
