/**
 * Clamps value within [min, max] bounds.
 */
export function clamp(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) {
    return min <= 1.0 && max >= 1.0 ? 1.0 : min;
  }
  return Math.min(Math.max(val, min), max);
}
