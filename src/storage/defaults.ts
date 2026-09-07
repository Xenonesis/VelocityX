import { SettingsV1 } from "./schema";
import { DEFAULT_SHORTCUTS } from "../core/shortcut-manager";
import {
  DEFAULT_ADVANCE_SECONDS,
  DEFAULT_PREFERRED_SPEED,
  DEFAULT_REWIND_SECONDS,
  DEFAULT_STEP,
  NORMAL_SPEED,
} from "../core/constants";

export const DEFAULT_SETTINGS: SettingsV1 = {
  schemaVersion: 1,
  enabled: true,
  defaultSpeed: NORMAL_SPEED,
  preferredSpeed: DEFAULT_PREFERRED_SPEED,
  speedStep: DEFAULT_STEP,
  rewindSeconds: DEFAULT_REWIND_SECONDS,
  advanceSeconds: DEFAULT_ADVANCE_SECONDS,
  rememberPlaybackSpeed: false,
  audioBoolean: true,
  startHidden: false,
  lastSpeed: NORMAL_SPEED,
  domainSpeeds: {},
  overlay: {
    enabled: true,
    position: {
      xRatio: 0.02,
      yRatio: 0.02,
    },
    opacity: 0.3,
    customCss: "",
  },
  shortcuts: DEFAULT_SHORTCUTS,
  siteRules: [
    { id: "rule-meet", match: "meet.google.com", enabled: false },
    { id: "rule-teams", match: "teams.microsoft.com", enabled: false },
    { id: "rule-imgur", match: "imgur.com", enabled: false },
  ],
  compatibility: {
    fightAutomaticRateReset: true,
  },
};
