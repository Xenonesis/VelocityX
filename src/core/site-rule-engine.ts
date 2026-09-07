import { SettingsV1, SiteRule } from "../storage/schema";
import { extractHostname, matchesDomainPattern } from "../utils/domain";
import { clamp } from "../utils/clamp";
import { MIN_SPEED, MAX_SPEED, NORMAL_SPEED, normalizeRate } from "./constants";

export interface ResolvedSiteConfig {
  enabled: boolean;
  overlayEnabled: boolean;
  initialSpeed: number;
  preferredSpeed: number;
  rememberSpeed: boolean;
  matchingRule?: SiteRule;
}

export class SiteRuleEngine {
  private settings: SettingsV1;

  constructor(settings: SettingsV1) {
    this.settings = settings;
  }

  updateSettings(settings: SettingsV1): void {
    this.settings = settings;
  }

  /**
   * Finds the best matching SiteRule for a hostname.
   */
  getMatchingRule(hostname: string): SiteRule | undefined {
    const normHost = hostname.toLowerCase().trim();
    for (const rule of this.settings.siteRules) {
      if (matchesDomainPattern(rule.match, normHost)) {
        return rule;
      }
    }
    return undefined;
  }

  /**
   * Resolves final operational parameters for a given location or URL.
   */
  resolveSiteConfig(urlOrLocation: string | Location): ResolvedSiteConfig {
    const hostname = extractHostname(urlOrLocation);
    const rule = this.getMatchingRule(hostname);

    // If global extension is disabled, everything is disabled
    if (!this.settings.enabled) {
      return {
        enabled: false,
        overlayEnabled: false,
        initialSpeed: NORMAL_SPEED,
        preferredSpeed: this.settings.preferredSpeed,
        rememberSpeed: false,
        matchingRule: rule,
      };
    }

    // If a site rule explicitly disables this domain
    if (rule && !rule.enabled) {
      return {
        enabled: false,
        overlayEnabled: false,
        initialSpeed: NORMAL_SPEED,
        preferredSpeed: this.settings.preferredSpeed,
        rememberSpeed: false,
        matchingRule: rule,
      };
    }

    // Overlay visibility
    let overlayEnabled = this.settings.overlay.enabled;
    if (rule && typeof rule.overlayEnabled === "boolean") {
      overlayEnabled = rule.overlayEnabled;
    }

    // Remember speed setting
    let rememberSpeed = this.settings.rememberPlaybackSpeed;
    if (rule && typeof rule.rememberSpeed === "boolean") {
      rememberSpeed = rule.rememberSpeed;
    }

    // Determine initial speed with strict priority:
    // 1. Site rule defaultSpeed
    // 2. Remembered last speed (if rememberSpeed is true)
    // 3. Global default speed
    let initialSpeed = this.settings.defaultSpeed;
    if (rememberSpeed && typeof this.settings.lastSpeed === "number") {
      initialSpeed = this.settings.lastSpeed;
    }
    if (rule && typeof rule.defaultSpeed === "number") {
      initialSpeed = rule.defaultSpeed;
    }

    // Preferred speed
    let preferredSpeed = this.settings.preferredSpeed;
    if (rule && typeof rule.preferredSpeed === "number") {
      preferredSpeed = rule.preferredSpeed;
    }

    return {
      enabled: true,
      overlayEnabled,
      initialSpeed: clamp(normalizeRate(initialSpeed), MIN_SPEED, MAX_SPEED),
      preferredSpeed: clamp(normalizeRate(preferredSpeed), MIN_SPEED, MAX_SPEED),
      rememberSpeed,
      matchingRule: rule,
    };
  }
}
