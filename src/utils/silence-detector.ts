interface CustomWindowAudio extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

export interface SilenceDetectorOptions {
  thresholdDb?: number; // default -45 dB
  minSilenceMs?: number; // default 500ms
  checkIntervalMs?: number; // default 50ms
  onSilenceChange: (isSilent: boolean) => void;
}

export class SilenceDetector {
  private readonly media: HTMLMediaElement;
  private readonly options: Required<SilenceDetectorOptions>;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private timerId: number | null = null;
  private silentSince: number | null = null;
  private currentlySilent = false;
  private destroyed = false;

  constructor(media: HTMLMediaElement, options: SilenceDetectorOptions) {
    this.media = media;
    this.options = {
      thresholdDb: options.thresholdDb ?? -45,
      minSilenceMs: options.minSilenceMs ?? 500,
      checkIntervalMs: options.checkIntervalMs ?? 50,
      onSilenceChange: options.onSilenceChange,
    };
  }

  start(): void {
    if (this.destroyed || this.timerId !== null) return;
    this.ensureGraph();
    this.timerId = window.setInterval(() => this.checkAudioLevel(), this.options.checkIntervalMs);
  }

  stop(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.silentSince = null;
    if (this.currentlySilent) {
      this.currentlySilent = false;
      this.options.onSilenceChange(false);
    }
  }

  private ensureGraph(): void {
    if (this.audioCtx && this.analyserNode) return;
    try {
      const win = window as CustomWindowAudio;
      const AudioCtx = win.AudioContext || win.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioCtx = new AudioCtx();
      this.sourceNode = this.audioCtx.createMediaElementSource(this.media);
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;

      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);
    } catch (err) {
      console.warn("[Velocity] SilenceDetector audio graph setup warning:", err);
    }
  }

  private checkAudioLevel(): void {
    if (this.destroyed || !this.analyserNode || this.media.paused) {
      return;
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
      return;
    }

    const dataArray = new Float32Array(this.analyserNode.fftSize);
    this.analyserNode.getFloatTimeDomainData(dataArray);

    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const sample = dataArray[i];
      sumSquares += sample * sample;
    }

    const rms = Math.sqrt(sumSquares / dataArray.length);
    const db = rms > 0.00001 ? 20 * Math.log10(rms) : -100;
    const isQuiet = db < this.options.thresholdDb;

    const now = Date.now();
    if (isQuiet) {
      if (this.silentSince === null) {
        this.silentSince = now;
      } else if (!this.currentlySilent && now - this.silentSince >= this.options.minSilenceMs) {
        this.currentlySilent = true;
        this.options.onSilenceChange(true);
      }
    } else {
      this.silentSince = null;
      if (this.currentlySilent) {
        this.currentlySilent = false;
        this.options.onSilenceChange(false);
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    try {
      this.analyserNode?.disconnect();
      this.sourceNode?.disconnect();
      if (this.audioCtx && this.audioCtx.state !== "closed") {
        this.audioCtx.close().catch(() => {});
      }
    } catch {
      // Ignored
    }
    this.audioCtx = null;
    this.sourceNode = null;
    this.analyserNode = null;
  }
}
