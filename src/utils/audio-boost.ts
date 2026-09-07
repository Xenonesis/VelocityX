interface CustomWindowAudio extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

interface LegacyMediaPitch extends HTMLMediaElement {
  mozPreservesPitch?: boolean;
  webkitPreservesPitch?: boolean;
}

/**
 * Web Audio API based gain amplifier allowing audio boost up to 5.0x (500%).
 */
export class AudioBooster {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private currentGain = 1.0;
  private readonly media: HTMLMediaElement;

  constructor(media: HTMLMediaElement) {
    this.media = media;
  }

  /**
   * Sets the audio volume multiplier (1.0 = 100% normal, 5.0 = 500% max boost).
   */
  setGain(multiplier: number): void {
    const clamped = Math.max(1.0, Math.min(5.0, multiplier));
    this.currentGain = clamped;

    if (clamped <= 1.0 && !this.audioCtx) {
      return; // Do not initialize Web Audio graph unnecessarily for normal volume
    }

    this.ensureGraph();
    if (this.gainNode) {
      this.gainNode.gain.value = clamped;
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
  }

  getGain(): number {
    return this.currentGain;
  }

  private ensureGraph(): void {
    if (this.audioCtx && this.gainNode) return;
    try {
      const win = window as CustomWindowAudio;
      const AudioCtx = win.AudioContext || win.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();
      this.sourceNode = this.audioCtx.createMediaElementSource(this.media);
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = this.currentGain;

      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
    } catch (err) {
      console.warn("[Velocity] AudioBooster Web Audio init warning:", err);
    }
  }

  destroy(): void {
    try {
      this.gainNode?.disconnect();
      this.sourceNode?.disconnect();
      if (this.audioCtx && this.audioCtx.state !== "closed") {
        this.audioCtx.close().catch(() => {});
      }
    } catch {
      // Cleanup safety
    }
    this.audioCtx = null;
    this.sourceNode = null;
    this.gainNode = null;
  }
}

/**
 * Sets pitch preservation on media element across browser prefixes.
 */
export function setMediaPreservesPitch(media: HTMLMediaElement, preserves: boolean): void {
  try {
    media.preservesPitch = preserves;
  } catch {
    // Ignored in restricted environments
  }

  const legacy = media as LegacyMediaPitch;
  if ("mozPreservesPitch" in legacy) {
    legacy.mozPreservesPitch = preserves;
  }
  if ("webkitPreservesPitch" in legacy) {
    legacy.webkitPreservesPitch = preserves;
  }
}
