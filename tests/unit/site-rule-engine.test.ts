import { describe, it, expect } from "vitest";
import { SiteRuleEngine } from "@/core/site-rule-engine";
import { DEFAULT_SETTINGS } from "@/storage/defaults";
import { SettingsV1 } from "@/storage/schema";

describe("SiteRuleEngine (clone.md §105)", () => {
  it("resolves default configuration when no site rules match", () => {
    const engine = new SiteRuleEngine(DEFAULT_SETTINGS);
    const config = engine.resolveSiteConfig("https://example.com/video");

    expect(config.enabled).toBe(true);
    expect(config.initialSpeed).toBe(1.0);
    expect(config.overlayEnabled).toBe(true);
  });

  it("prioritizes per-site rule default speed over global default and rememberSpeed (clone.md §105)", () => {
    const settings: SettingsV1 = {
      ...DEFAULT_SETTINGS,
      defaultSpeed: 1.25,
      rememberPlaybackSpeed: true,
      lastSpeed: 1.75,
      siteRules: [
        {
          id: "coursera-rule",
          match: "*.coursera.org",
          enabled: true,
          defaultSpeed: 2.0,
        },
      ],
    };

    const engine = new SiteRuleEngine(settings);

    // Unmatched site (YouTube) should pick remembered last speed (1.75)
    const ytConfig = engine.resolveSiteConfig("https://youtube.com/watch?v=123");
    expect(ytConfig.initialSpeed).toBe(1.75);

    // Matched site (Coursera) should strictly pick site default (2.0)
    const courseraConfig = engine.resolveSiteConfig("https://sub.coursera.org/learn/ml");
    expect(courseraConfig.initialSpeed).toBe(2.0);
  });

  it("disables extension when site rule specifies enabled: false", () => {
    const settings: SettingsV1 = {
      ...DEFAULT_SETTINGS,
      siteRules: [
        {
          id: "disabled-rule",
          match: "zoom.us",
          enabled: false,
        },
      ],
    };

    const engine = new SiteRuleEngine(settings);
    const config = engine.resolveSiteConfig("https://zoom.us/join");

    expect(config.enabled).toBe(false);
    expect(config.overlayEnabled).toBe(false);
  });

  it("disables everything when global settings.enabled is false", () => {
    const settings: SettingsV1 = {
      ...DEFAULT_SETTINGS,
      enabled: false,
    };

    const engine = new SiteRuleEngine(settings);
    const config = engine.resolveSiteConfig("https://youtube.com");

    expect(config.enabled).toBe(false);
  });
});
