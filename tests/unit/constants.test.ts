import { describe, it, expect } from "vitest";
import { normalizeRate, formatRate, formatTime, MIN_SPEED, MAX_SPEED } from "@/core/constants";
import { clamp } from "@/utils/clamp";

describe("constants and precision helpers", () => {
  it("normalizes rate to 2 decimal places and handles float inaccuracies", () => {
    expect(normalizeRate(1.5000000000000002)).toBe(1.5);
    expect(normalizeRate(1.255)).toBe(1.26);
    expect(normalizeRate(0.1 + 0.2)).toBe(0.3);
    expect(normalizeRate(NaN)).toBe(1.0);
    expect(normalizeRate(Infinity)).toBe(1.0);
  });

  it("formats rate string with 2 fixed decimal places", () => {
    expect(formatRate(1)).toBe("1.00");
    expect(formatRate(1.5)).toBe("1.50");
    expect(formatRate(1.25)).toBe("1.25");
    expect(formatRate(0.07)).toBe("0.07");
    expect(formatRate(16)).toBe("16.00");
  });

  it("clamps values between min and max bounds", () => {
    expect(clamp(0.01, MIN_SPEED, MAX_SPEED)).toBe(MIN_SPEED);
    expect(clamp(20, MIN_SPEED, MAX_SPEED)).toBe(MAX_SPEED);
    expect(clamp(2.5, MIN_SPEED, MAX_SPEED)).toBe(2.5);
    expect(clamp(NaN, MIN_SPEED, MAX_SPEED)).toBe(MIN_SPEED);
  });

  it("formats time correctly into MM:SS and HH:MM:SS", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(45)).toBe("0:45");
    expect(formatTime(75)).toBe("1:15");
    expect(formatTime(3665)).toBe("1:01:05");
    expect(formatTime(-10)).toBe("0:00");
  });
});
