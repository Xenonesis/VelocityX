import {
  MIN_SPEED,
  MAX_SPEED,
  DEFAULT_STEP,
  NORMAL_SPEED,
  DEFAULT_PREFERRED_SPEED,
  normalizeRate,
  RateSource,
} from "./constants";
import { clamp } from "../utils/clamp";
import { isLiveMedia } from "../utils/media";
import { AudioBooster, setMediaPreservesPitch } from "../utils/audio-boost";
import { SilenceDetector } from "../utils/silence-detector";
export interface MediaControllerEvents {
  onRateChange?: (controller: MediaController, rate: number, source: RateSource) => void;
  onStateChange?: (controller: MediaController) => void;
  onDestroy?: (controller: MediaController) => void;
}

export class MediaController {
  readonly media: HTMLMediaElement;
  private readonly abortController = new AbortController();
  private readonly events: MediaControllerEvents;
  private readonly audioBooster: AudioBooster;
  preservesPitch = true;
  silenceSkipEnabled = false;
  private silenceDetector: SilenceDetector | null = null;
  private rateBeforeSilence: number | null = null;
  desiredRate: number;
  observedRate: number;
  lastSource: RateSource = "initial";
  markerTime: number | null = null;
  positionBeforeJump: number | null = null;
  previousRateBeforeReset: number | null = null;
  previousRateBeforePreferred: number | null = null;
  lastInteractionAt = Date.now();
  destroyed = false;

  constructor(media: HTMLMediaElement, initialRate = NORMAL_SPEED, events: MediaControllerEvents = {}) {
    this.media = media;
    this.events = events;
    this.audioBooster = new AudioBooster(media);
    setMediaPreservesPitch(media, true);
    const rate = clamp(normalizeRate(initialRate), MIN_SPEED, MAX_SPEED);
    this.desiredRate = rate;
    this.observedRate = media.playbackRate;

    // Apply initial desired rate if differing
    if (media.playbackRate !== rate) {
      try {
        media.playbackRate = rate;
      } catch {
        // Some DRM or restricted players may reject initial assignment
      }
    }

    this.bindEvents();
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.media.addEventListener(
      "ratechange",
      () => {
        this.observedRate = this.media.playbackRate;
        this.events.onRateChange?.(this, this.observedRate, this.lastSource);
      },
      { signal }
    );

    const touchEvents = ["play", "pause", "timeupdate", "loadedmetadata", "emptied"] as const;
    for (const evt of touchEvents) {
      this.media.addEventListener(
        evt,
        () => {
          this.events.onStateChange?.(this);
        },
        { signal }
      );
    }
  }

  /**
   * Sets target playback rate with normalized clamping and source tracking.
   */
  setRate(targetRate: number, source: RateSource = "extension"): void {
    if (this.destroyed) return;
    const clamped = clamp(normalizeRate(targetRate), MIN_SPEED, MAX_SPEED);
    this.desiredRate = clamped;
    this.lastSource = source;
    this.lastInteractionAt = Date.now();

    try {
      if (this.media.playbackRate !== clamped) {
        this.media.playbackRate = clamped;
      }
    } catch (err) {
      console.warn("[Velocity] Failed to set playbackRate on media:", err);
    }
  }

  /**
   * Increments rate by step (default 0.1)
   */
  increaseRate(step = DEFAULT_STEP): void {
    this.setRate(this.desiredRate + step, "extension");
  }

  /**
   * Decrements rate by step (default 0.1)
   */
  decreaseRate(step = DEFAULT_STEP): void {
    this.setRate(this.desiredRate - step, "extension");
  }

  /**
   * Resets rate to normal or specified reset target (default 1.0).
   * If already at target rate, toggles back to previous rate before reset.
   */
  resetRate(target = NORMAL_SPEED): void {
    const normTarget = clamp(normalizeRate(target), MIN_SPEED, MAX_SPEED);
    if (this.desiredRate === normTarget) {
      if (this.previousRateBeforeReset !== null) {
        const restoreRate = this.previousRateBeforeReset;
        this.previousRateBeforeReset = null;
        this.setRate(restoreRate, "extension");
        return;
      }
    } else {
      this.previousRateBeforeReset = this.desiredRate;
    }
    this.setRate(normTarget, "extension");
  }
  /**
   * Seeks relative seconds (+ or -) with safety bounds and live stream detection.
   */
  seekBy(seconds: number): void {
    if (this.destroyed || !Number.isFinite(seconds)) return;
    if (isLiveMedia(this.media)) return;

    this.lastInteractionAt = Date.now();
    const duration = Number.isFinite(this.media.duration) ? this.media.duration : Infinity;
    const nextTime = clamp(this.media.currentTime + seconds, 0, duration);

    try {
      this.media.currentTime = nextTime;
    } catch (err) {
      console.warn("[Velocity] Failed to seek media:", err);
    }
  }

  /**
   * Sets a temporal marker at current video playback position.
   */
  setMarker(): void {
    if (this.destroyed) return;
    this.markerTime = this.media.currentTime;
    this.lastInteractionAt = Date.now();
  }

  /**
   * Jumps to saved marker time if set. Toggles back to pre-jump position if already at marker.
   */
  jumpToMarker(): void {
    if (this.destroyed || this.markerTime === null) return;
    this.lastInteractionAt = Date.now();
    const current = this.media.currentTime;
    if (this.positionBeforeJump !== null && Math.abs(current - this.markerTime) < 0.5) {
      const returnPos = this.positionBeforeJump;
      this.positionBeforeJump = null;
      try {
        this.media.currentTime = returnPos;
      } catch (err) {
        console.warn("[Velocity] Failed to return from marker:", err);
      }
      return;
    }
    this.positionBeforeJump = current;
    try {
      this.media.currentTime = this.markerTime;
    } catch (err) {
      console.warn("[Velocity] Failed to jump to marker:", err);
    }
  }

  /**
   * Toggles between preferred rate and previous rate.
   */
  togglePreferredRate(preferred = DEFAULT_PREFERRED_SPEED): void {
    if (this.destroyed) return;
    const normPreferred = clamp(normalizeRate(preferred), MIN_SPEED, MAX_SPEED);

    if (this.desiredRate === normPreferred) {
      // Return to prior rate if available, otherwise 1.0
      const restoreRate = this.previousRateBeforePreferred ?? NORMAL_SPEED;
      this.previousRateBeforePreferred = null;
      this.setRate(restoreRate, "extension");
    } else {
      this.previousRateBeforePreferred = this.desiredRate;
      this.setRate(normPreferred, "extension");
    }
  }


  getAudioGain(): number {
    return this.audioBooster.getGain();
  }

  setAudioGain(multiplier: number): void {
    if (this.destroyed) return;
    this.lastInteractionAt = Date.now();
    this.audioBooster.setGain(multiplier);
  }

  increaseAudioGain(step = 0.2): void {
    this.setAudioGain(this.audioBooster.getGain() + step);
  }

  decreaseAudioGain(step = 0.2): void {
    this.setAudioGain(this.audioBooster.getGain() - step);
  }

  togglePitch(): boolean {
    if (this.destroyed) return this.preservesPitch;
    this.lastInteractionAt = Date.now();
    this.preservesPitch = !this.preservesPitch;
    setMediaPreservesPitch(this.media, this.preservesPitch);
    return this.preservesPitch;
  }

  async togglePictureInPicture(): Promise<boolean> {
    if (this.destroyed) return false;
    this.lastInteractionAt = Date.now();
    if (!(this.media instanceof HTMLVideoElement)) return false;

    try {
      if (document.pictureInPictureElement === this.media) {
        await document.exitPictureInPicture();
        return false;
      } else {
        await this.media.requestPictureInPicture();
        return true;
      }
    } catch (err) {
      console.warn("[Velocity] PiP request failed:", err);
      return false;
    }
  }

  toggleSilenceSkip(force?: boolean): boolean {
    if (this.destroyed) return this.silenceSkipEnabled;
    this.lastInteractionAt = Date.now();
    this.silenceSkipEnabled = force ?? !this.silenceSkipEnabled;

    if (this.silenceSkipEnabled) {
      if (!this.silenceDetector) {
        this.silenceDetector = new SilenceDetector(this.media, {
          onSilenceChange: (isSilent) => {
            if (this.destroyed || !this.silenceSkipEnabled) return;
            if (isSilent) {
              if (this.rateBeforeSilence === null) {
                this.rateBeforeSilence = this.desiredRate;
              }
              this.setRate(Math.max(this.desiredRate, 3.0), "extension");
            } else if (this.rateBeforeSilence !== null) {
              const restore = this.rateBeforeSilence;
              this.rateBeforeSilence = null;
              this.setRate(restore, "extension");
            }
          },
        });
      }
      this.silenceDetector.start();
    } else {
      this.silenceDetector?.stop();
      if (this.rateBeforeSilence !== null) {
        const restore = this.rateBeforeSilence;
        this.rateBeforeSilence = null;
        this.setRate(restore, "extension");
      }
    }

    return this.silenceSkipEnabled;
  }
  /**
   * Complete deterministic teardown of all event listeners and timers.
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abortController.abort();
    this.audioBooster.destroy();
    this.silenceDetector?.destroy();
    this.events.onDestroy?.(this);
  }
}
