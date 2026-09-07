import { INTENT_WINDOW_MS } from "./constants";

export class IntentClassifier {
  private lastTrustedInteractionAt = 0;
  private abortController: AbortController | null = null;

  constructor() {
    this.attach();
  }

  /**
   * Attaches capturing event listeners to detect user gestures near players.
   */
  attach(root: EventTarget = document): void {
    this.detach();
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const gestureEvents = ["pointerdown", "click", "touchstart", "keydown"] as const;

    for (const evt of gestureEvents) {
      try {
        root.addEventListener(
          evt,
          (e: Event) => {
            // Check if it was a real user-initiated event
            if (e.isTrusted) {
              this.recordInteraction();
            }
          },
          { capture: true, passive: true, signal }
        );
      } catch {
        // Safe fallback for environments without signal support on addEventListener
      }
    }
  }

  /**
   * Records a user interaction timestamp.
   */
  recordInteraction(): void {
    this.lastTrustedInteractionAt = Date.now();
  }

  /**
   * Checks whether a trusted user interaction occurred within the intent window.
   */
  isRecentInteraction(windowMs = INTENT_WINDOW_MS): boolean {
    return Date.now() - this.lastTrustedInteractionAt <= windowMs;
  }

  getLastInteractionTime(): number {
    return this.lastTrustedInteractionAt;
  }

  detach(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
