import { describe, it, expect } from "vitest";
import { migrateSettings } from "@/storage/migrations";
import { DEFAULT_SETTINGS } from "@/storage/defaults";
import { MIN_SPEED, MAX_SPEED } from "@/core/constants";

describe("Storage Migrations & Validation", () => {
  it("returns default settings on null or empty input", () => {
    const result1 = migrateSettings(null);
    expect(result1).toEqual(DEFAULT_SETTINGS);

    const result2 = migrateSettings({});
    expect(result2.schemaVersion).toBe(1);
    expect(result2.defaultSpeed).toBe(1.0);
    expect(result2.shortcuts).toHaveLength(DEFAULT_SETTINGS.shortcuts.length);
  });

  it("clamps out-of-bounds speeds and numbers", () => {
    const raw = {
      defaultSpeed: 999,
      preferredSpeed: -5,
      speedStep: 50,
      rewindSeconds: -10,
      overlay: {
        opacity: 5.0,
        position: { xRatio: 2.0, yRatio: -1.0 },
      },
    };

    const result = migrateSettings(raw);
    expect(result.defaultSpeed).toBe(MAX_SPEED);
    expect(result.preferredSpeed).toBe(MIN_SPEED);
    expect(result.speedStep).toBe(5.0);
    expect(result.rewindSeconds).toBe(1);
    expect(result.overlay.opacity).toBe(1.0);
    expect(result.overlay.position.xRatio).toBe(0.95);
    expect(result.overlay.position.yRatio).toBe(0);
  });

  it("preserves valid user shortcuts and site rules", () => {
    const raw = {
      siteRules: [
        {
          id: "r1",
          match: "YOUTUBE.COM",
          enabled: true,
          defaultSpeed: 1.5,
        },
      ],
      rememberPlaybackSpeed: true,
      lastSpeed: 2.25,
    };

    const result = migrateSettings(raw);
    expect(result.rememberPlaybackSpeed).toBe(true);
    expect(result.lastSpeed).toBe(2.25);
    expect(result.siteRules).toHaveLength(1);
    expect(result.siteRules[0].match).toBe("youtube.com");
    expect(result.siteRules[0].defaultSpeed).toBe(1.5);
  });
});
