import { SettingsV1, SiteRule } from "./schema";
import { DEFAULT_SETTINGS } from "./defaults";
import { clamp } from "../utils/clamp";
import { MIN_SPEED, MAX_SPEED, normalizeRate } from "../core/constants";

/**
 * Validates and migrates arbitrary stored data into a clean, safe SettingsV1 object.
 */
export function migrateSettings(raw: unknown): SettingsV1 {
  if (!raw || typeof raw !== "object") {
    return structuredClone(DEFAULT_SETTINGS);
  }

  const data = raw as Record<string, unknown>;

  // Initialize from defaults
  const settings: SettingsV1 = structuredClone(DEFAULT_SETTINGS);

  if (typeof data.enabled === "boolean") {
    settings.enabled = data.enabled;
  }

  if (typeof data.defaultSpeed === "number" && Number.isFinite(data.defaultSpeed)) {
    settings.defaultSpeed = clamp(normalizeRate(data.defaultSpeed), MIN_SPEED, MAX_SPEED);
  }

  if (typeof data.preferredSpeed === "number" && Number.isFinite(data.preferredSpeed)) {
    settings.preferredSpeed = clamp(normalizeRate(data.preferredSpeed), MIN_SPEED, MAX_SPEED);
  }

  if (typeof data.speedStep === "number" && Number.isFinite(data.speedStep)) {
    settings.speedStep = clamp(data.speedStep, 0.01, 5.0);
  }

  if (typeof data.rewindSeconds === "number" && Number.isFinite(data.rewindSeconds)) {
    settings.rewindSeconds = Math.max(1, Math.round(data.rewindSeconds));
  }

  if (typeof data.advanceSeconds === "number" && Number.isFinite(data.advanceSeconds)) {
    settings.advanceSeconds = Math.max(1, Math.round(data.advanceSeconds));
  }

  if (typeof data.rememberPlaybackSpeed === "boolean") {
    settings.rememberPlaybackSpeed = data.rememberPlaybackSpeed;
  }

  if (typeof data.lastSpeed === "number" && Number.isFinite(data.lastSpeed)) {
    settings.lastSpeed = clamp(normalizeRate(data.lastSpeed), MIN_SPEED, MAX_SPEED);
  }

  // Overlay validation
  if (data.overlay && typeof data.overlay === "object") {
    const ov = data.overlay as Record<string, unknown>;
    if (typeof ov.enabled === "boolean") {
      settings.overlay.enabled = ov.enabled;
    }
    if (ov.position && typeof ov.position === "object") {
      const pos = ov.position as Record<string, unknown>;
      if (typeof pos.xRatio === "number" && Number.isFinite(pos.xRatio)) {
        settings.overlay.position.xRatio = clamp(pos.xRatio, 0, 0.95);
      }
      if (typeof pos.yRatio === "number" && Number.isFinite(pos.yRatio)) {
        settings.overlay.position.yRatio = clamp(pos.yRatio, 0, 0.95);
      }
    }
    if (typeof ov.opacity === "number" && Number.isFinite(ov.opacity)) {
      settings.overlay.opacity = clamp(ov.opacity, 0.1, 1.0);
    }
    if (typeof ov.customCss === "string") {
      // Guard against excessively large custom CSS injections
      settings.overlay.customCss = ov.customCss.slice(0, 10000);
    }
  }

  // Shortcuts validation
  if (Array.isArray(data.shortcuts) && data.shortcuts.length > 0) {
    const validShortcuts = [];
    for (const item of data.shortcuts) {
      if (item && typeof item === "object" && typeof item.code === "string" && item.action) {
        validShortcuts.push(item);
      }
    }
    if (validShortcuts.length > 0) {
      settings.shortcuts = validShortcuts;
    }
  }

  // Site rules validation
  if (Array.isArray(data.siteRules)) {
    const validRules: SiteRule[] = [];
    for (const rule of data.siteRules) {
      if (rule && typeof rule === "object" && typeof rule.match === "string") {
        validRules.push({
          id: typeof rule.id === "string" ? rule.id : `rule_${Math.random().toString(36).slice(2, 8)}`,
          match: rule.match.toLowerCase().trim(),
          enabled: typeof rule.enabled === "boolean" ? rule.enabled : true,
          defaultSpeed:
            typeof rule.defaultSpeed === "number"
              ? clamp(normalizeRate(rule.defaultSpeed), MIN_SPEED, MAX_SPEED)
              : undefined,
          preferredSpeed:
            typeof rule.preferredSpeed === "number"
              ? clamp(normalizeRate(rule.preferredSpeed), MIN_SPEED, MAX_SPEED)
              : undefined,
          rememberSpeed: typeof rule.rememberSpeed === "boolean" ? rule.rememberSpeed : undefined,
          overlayEnabled: typeof rule.overlayEnabled === "boolean" ? rule.overlayEnabled : undefined,
        });
      }
    }
    settings.siteRules = validRules;
  }

  // Compatibility validation
  if (data.compatibility && typeof data.compatibility === "object") {
    const comp = data.compatibility as Record<string, unknown>;
    if (typeof comp.fightAutomaticRateReset === "boolean") {
      settings.compatibility.fightAutomaticRateReset = comp.fightAutomaticRateReset;
    }
  }

  return settings;
}
