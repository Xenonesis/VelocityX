import { migrateSettings } from "../storage/migrations";
import { SettingsV1 } from "../storage/schema";
import { DEFAULT_SETTINGS } from "../storage/defaults";
import { MIN_SPEED } from "../core/constants";
const SETTINGS_KEY = "velocitySettings";

class IsolatedBridge {
  private currentSettings: SettingsV1 = DEFAULT_SETTINGS;
  private saveDebounceTimer: number | null = null;
  init(): void {
    this.loadAndPublishSettings();
    this.bindStorageListeners();
    this.bindPageListeners();
    this.bindRuntimeListeners();
  }

  private async loadAndPublishSettings(): Promise<void> {
    try {
      const stored = await chrome.storage.sync.get(SETTINGS_KEY);
      this.currentSettings = migrateSettings(stored[SETTINGS_KEY]);
    } catch {
      try {
        const localStored = await chrome.storage.local.get(SETTINGS_KEY);
        this.currentSettings = migrateSettings(localStored[SETTINGS_KEY]);
      } catch {
        this.currentSettings = migrateSettings(null);
      }
    }

    this.dispatchToMain("velocity:settings:init", this.currentSettings);
  }

  private bindStorageListeners(): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" || areaName === "local") {
        if (changes[SETTINGS_KEY]) {
          this.currentSettings = migrateSettings(changes[SETTINGS_KEY].newValue);
          this.dispatchToMain("velocity:settings:update", this.currentSettings);
        }
      }
    });
  }

  private bindPageListeners(): void {
    // Listen for requests from MAIN world to save lastSpeed
    // Listen for requests from MAIN world to save lastSpeed and domain speed
    window.addEventListener("velocity:storage:save-last-speed", (e: Event) => {
      const customEvt = e as CustomEvent<{ speed: number; domain?: string }>;
      const speed = customEvt.detail?.speed;
      const domain = customEvt.detail?.domain;
      if (typeof speed === "number" && Number.isFinite(speed) && speed >= MIN_SPEED) {
        this.currentSettings.lastSpeed = speed;
        if (domain) {
          if (!this.currentSettings.domainSpeeds) {
            this.currentSettings.domainSpeeds = {};
          }
          this.currentSettings.domainSpeeds[domain.toLowerCase()] = speed;
        }
        this.debounceSave();
      }
    });

    // Listen for requests from MAIN world to save overlay position
    window.addEventListener("velocity:storage:save-position", (e: Event) => {
      const customEvt = e as CustomEvent<{ xRatio: number; yRatio: number }>;
      const pos = customEvt.detail;
      if (pos && typeof pos.xRatio === "number" && typeof pos.yRatio === "number") {
        this.currentSettings.overlay.position = {
          xRatio: pos.xRatio,
          yRatio: pos.yRatio,
        };
        this.debounceSave();
      }
    });

    // Heartbeat/ready handshake from MAIN world
    window.addEventListener("velocity:main:ready", () => {
      this.dispatchToMain("velocity:settings:init", this.currentSettings);
    });
  }

  private bindRuntimeListeners(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!message || typeof message !== "object") return;

      if (message.type === "GET_MEDIA_STATUS") {
        // Query main world status via custom event
        const nonce = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const timeout = setTimeout(() => {
          window.removeEventListener(`velocity:status:reply:${nonce}`, onReply);
          sendResponse({ hasMedia: false, activeRate: this.currentSettings.defaultSpeed });
        }, 300);

        const onReply = (e: Event) => {
          clearTimeout(timeout);
          window.removeEventListener(`velocity:status:reply:${nonce}`, onReply);
          const detail = (e as CustomEvent).detail;
          sendResponse(detail);
        };

        window.addEventListener(`velocity:status:reply:${nonce}`, onReply);
        this.dispatchToMain("velocity:status:query", { nonce });
        return true; // Keep message channel open for async response
      }

      if (message.type === "EXECUTE_ACTION") {
        this.dispatchToMain("velocity:action:execute", message.action);
        sendResponse({ success: true });
      }

      if (message.type === "UPDATE_SETTINGS") {
        if (message.settings) {
          this.currentSettings = migrateSettings(message.settings);
          this.debounceSave();
          this.dispatchToMain("velocity:settings:update", this.currentSettings);
        }
        sendResponse({ success: true });
      }
    });
  }

  private debounceSave(): void {
    clearTimeout(this.saveDebounceTimer ?? undefined);
    this.saveDebounceTimer = window.setTimeout(async () => {
      try {
        await chrome.storage.sync.set({ [SETTINGS_KEY]: this.currentSettings });
      } catch {
        try {
          await chrome.storage.local.set({ [SETTINGS_KEY]: this.currentSettings });
        } catch (err) {
          console.warn("[Velocity] Storage save failed:", err);
        }
      }
    }, 350);
  }

  private dispatchToMain(eventName: string, detail: unknown): void {
    try {
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: structuredClone(detail),
        })
      );
    } catch {
      // Safe fallback
    }
  }
}

const bridge = new IsolatedBridge();
bridge.init();
