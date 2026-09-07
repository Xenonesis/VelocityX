/**
 * Velocity - Core Constants & Precision Helpers
 */

export const MIN_SPEED = 0.07;
export const MAX_SPEED = 16.0;
export const DEFAULT_STEP = 0.1;
export const NORMAL_SPEED = 1.0;
export const DEFAULT_PREFERRED_SPEED = 1.8;

export const DEFAULT_REWIND_SECONDS = 10;
export const DEFAULT_ADVANCE_SECONDS = 10;

export const MIN_OVERLAY_WIDTH = 160;
export const MIN_OVERLAY_HEIGHT = 90;

export const MAX_CORRECTIONS_PER_WINDOW = 6;
export const CORRECTION_WINDOW_MS = 1000;
export const INTENT_WINDOW_MS = 500;

export type RateSource =
  | "extension"
  | "site-user"
  | "site-automatic"
  | "initial"
  | "restored";

/**
 * Normalizes floating point rates to 2 decimal places.
 * Prevents 1.5000000000000002 errors.
 */
export function normalizeRate(rate: number): number {
  if (!Number.isFinite(rate) || Number.isNaN(rate)) return NORMAL_SPEED;
  return Math.round((rate + Number.EPSILON) * 100) / 100;
}

/**
 * Formats rate for display (e.g. 2.20, 1.00, 1.50)
 */
export function formatRate(rate: number): string {
  const norm = normalizeRate(rate);
  return norm.toFixed(2);
}

/**
 * Formats seconds into human-readable MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const paddedSecs = secs.toString().padStart(2, "0");
  if (hrs > 0) {
    const paddedMins = mins.toString().padStart(2, "0");
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${mins}:${paddedSecs}`;
}
