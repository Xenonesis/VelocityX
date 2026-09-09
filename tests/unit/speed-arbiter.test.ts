import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SpeedArbiter } from "@/core/speed-arbiter";
import { IntentClassifier } from "@/core/intent-classifier";

describe("SpeedArbiter - Critical Matrix (clone.md §65)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Test Case A: restores desired rate when site automatically sets 1x", () => {
    const arbiter = new SpeedArbiter(2.0);

    // Site automatically sets 1.0 (isTrustedUserInteraction = false)
    const decision = arbiter.observeRateChange(1.0, false, false);

    expect(decision).toEqual({
      type: "restore",
      rate: 2.0,
      source: "restored",
    });
    expect(arbiter.desiredRate).toBe(2.0);
  });

  it("Test Case B: accepts native rate change when user intentionally uses native player menu", () => {
    const arbiter = new SpeedArbiter(2.0);

    // User clicks native speed menu and selects 1.5x (isTrustedUserInteraction = true)
    const decision = arbiter.observeRateChange(1.5, true, false);

    expect(decision).toEqual({
      type: "accept",
      rate: 1.5,
      source: "site-user",
    });
    // Desired rate is now updated to the user's choice
    expect(arbiter.desiredRate).toBe(1.5);
  });

  it("Test Case C: accepts rate change when initiated by extension", () => {
    const arbiter = new SpeedArbiter(1.0);

    // Extension triggers 1.8x
    const decision = arbiter.observeRateChange(1.8, false, true);

    expect(decision).toEqual({
      type: "accept",
      rate: 1.8,
      source: "extension",
    });
    expect(arbiter.desiredRate).toBe(1.8);
  });

  it("Test Case D: trips circuit breaker when site aggressively oscillates speed", () => {
    const arbiter = new SpeedArbiter(2.0);

    // Rapid successive automatic resets within 1000ms window
    for (let i = 0; i < 5; i++) {
      const decision = arbiter.observeRateChange(1.0, false, false);
      expect(decision.type).toBe("restore");
      vi.advanceTimersByTime(50);
    }

    // 6th correction reaches MAX_CORRECTIONS_PER_WINDOW (6)
    const tripDecision = arbiter.observeRateChange(1.0, false, false);
    expect(tripDecision.type).toBe("ignore");
    expect(arbiter.circuitBreakerTripped).toBe(true);

    // Further automatic resets are ignored while tripped
    const subsequent = arbiter.observeRateChange(1.0, false, false);
    expect(subsequent.type).toBe("ignore");

    // After window passes (1000ms), circuit breaker can recover
    vi.advanceTimersByTime(1100);
    const recovered = arbiter.observeRateChange(1.0, false, false);
    expect(recovered.type).toBe("restore");
    expect(arbiter.circuitBreakerTripped).toBe(false);
  });

  it("accepts automatic changes if fightAutomaticResets is disabled in settings", () => {
    const arbiter = new SpeedArbiter(2.0, false);

    const decision = arbiter.observeRateChange(1.0, false, false);
    expect(decision).toEqual({
      type: "accept",
      rate: 1.0,
      source: "site-automatic",
    });
    expect(arbiter.desiredRate).toBe(2.0); // original desired stays intact
  });

  it("ignores zero or sub-minimum rates from player pauses and buffering", () => {
    const arbiter = new SpeedArbiter(1.8);

    // Player sets rate to 0 during pause or buffer (even if user clicked recently)
    const decisionOnPause = arbiter.observeRateChange(0, true, false);
    expect(decisionOnPause).toEqual({ type: "ignore" });
    expect(arbiter.desiredRate).toBe(1.8); // Must never be overwritten by 0

    // Negative or sub-minimum rates
    const decisionSubMin = arbiter.observeRateChange(0.05, false, false);
    expect(decisionSubMin).toEqual({ type: "ignore" });
    expect(arbiter.desiredRate).toBe(1.8);

    // Invalid rates
    const decisionNaN = arbiter.observeRateChange(NaN, false, false);
    expect(decisionNaN).toEqual({ type: "ignore" });
    expect(arbiter.desiredRate).toBe(1.8);
  });
});

describe("IntentClassifier", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("identifies recent trusted user gestures within intent window", () => {
    const classifier = new IntentClassifier();

    expect(classifier.isRecentInteraction(500)).toBe(false);

    classifier.recordInteraction();
    expect(classifier.isRecentInteraction(500)).toBe(true);

    // After 600ms, interaction is outside 500ms window
    vi.advanceTimersByTime(600);
    expect(classifier.isRecentInteraction(500)).toBe(false);

    classifier.detach();
  });
});
