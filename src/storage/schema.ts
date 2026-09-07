import { ShortcutBinding } from "../core/shortcut-manager";

export interface SiteRule {
  id: string;
  match: string; // Domain or wildcard, e.g. "youtube.com", "*.coursera.org"
  enabled: boolean;
  defaultSpeed?: number;
  preferredSpeed?: number;
  rememberSpeed?: boolean;
  overlayEnabled?: boolean;
}

export interface OverlaySettings {
  enabled: boolean;
  position: {
    xRatio: number;
    yRatio: number;
  };
  opacity: number;
  customCss: string;
}

export interface CompatibilitySettings {
  fightAutomaticRateReset: boolean;
}

export interface SettingsV1 {
  schemaVersion: 1;
  enabled: boolean;
  defaultSpeed: number;
  preferredSpeed: number;
  speedStep: number;
  rewindSeconds: number;
  advanceSeconds: number;
  rememberPlaybackSpeed: boolean;
  audioBoolean?: boolean;
  startHidden?: boolean;
  lastSpeed: number;
  domainSpeeds?: Record<string, number>;
  overlay: OverlaySettings;
  shortcuts: ShortcutBinding[];
  siteRules: SiteRule[];
  compatibility: CompatibilitySettings;
}
