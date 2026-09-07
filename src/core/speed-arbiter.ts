import {
  MAX_CORRECTIONS_PER_WINDOW,
  CORRECTION_WINDOW_MS,
  NORMAL_SPEED,
  normalizeRate,
  RateSource,
} from "./constants";

export type RateDecision =
  | { type: "accept"; rate: number; source: RateSource }
  | { type: "restore"; rate: number; source: "restored" }
  | { type: "ignore" };

export class SpeedArbiter {
  desiredRate: number;
  fightAutomaticResets: boolean;

  private consecutiveCorrections = 0;
  private windowStart = 0;
  circuitBreakerTripped = false;

  constructor(initialRate = NORMAL_SPEED, fightAutomaticResets = true) {
    this.desiredRate = normalizeRate(initialRate);
    this.fightAutomaticResets = fightAutomaticResets;
  }

  /**
   * Sets the user's intended target rate explicitly (e.g. from shortcut or popup).
   */
  setDesiredRate(rate: number): void {
    this.desiredRate = normalizeRate(rate);
    this.consecutiveCorrections = 0;
    this.circuitBreakerTripped = false;
  }

  /**
   * Evaluates a ratechange event and decides whether to accept, restore, or ignore.
   */
  observeRateChange(
    observedRate: number,
    isTrustedUserInteraction: boolean,
    fromExtension = false
  ): RateDecision {
    const normalizedObserved = normalizeRate(observedRate);

    // 1. Explicit change requested by extension itself
    if (fromExtension) {
      this.desiredRate = normalizedObserved;
      this.consecutiveCorrections = 0;
      this.circuitBreakerTripped = false;
      return { type: "accept", rate: this.desiredRate, source: "extension" };
    }

    // 2. Already matches our desired target rate
    if (normalizedObserved === this.desiredRate) {
      this.consecutiveCorrections = 0;
      return { type: "accept", rate: this.desiredRate, source: "extension" };
    }

    // 3. User intentionally interacted with native player controls
    if (isTrustedUserInteraction) {
      this.desiredRate = normalizedObserved;
      this.consecutiveCorrections = 0;
      this.circuitBreakerTripped = false;
      return { type: "accept", rate: this.desiredRate, source: "site-user" };
    }

    // 4. If fightback is disabled in settings, allow site automatic change
    if (!this.fightAutomaticResets) {
      return { type: "accept", rate: normalizedObserved, source: "site-automatic" };
    }

    // 5. Site attempted automatic reset: check loop protection circuit breaker
    const now = Date.now();
    if (now - this.windowStart > CORRECTION_WINDOW_MS) {
      this.windowStart = now;
      this.consecutiveCorrections = 0;
      this.circuitBreakerTripped = false;
    }

    this.consecutiveCorrections++;

    if (this.consecutiveCorrections >= MAX_CORRECTIONS_PER_WINDOW) {
      this.circuitBreakerTripped = true;
      console.warn(
        `[Velocity] Speed oscillation circuit breaker tripped (${this.consecutiveCorrections} corrections in window).`
      );
      return { type: "ignore" };
    }

    // Restore desired target rate
    return { type: "restore", rate: this.desiredRate, source: "restored" };
  }

  resetCircuitBreaker(): void {
    this.consecutiveCorrections = 0;
    this.circuitBreakerTripped = false;
    this.windowStart = 0;
  }
}
