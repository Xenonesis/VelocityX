import { SettingsV1 } from "../storage/schema";
import { DEFAULT_SETTINGS } from "../storage/defaults";
import { SiteRuleEngine } from "../core/site-rule-engine";
import { MediaRegistry } from "../core/media-registry";
import { MediaController } from "../core/media-controller";
import { SelectionManager } from "../core/selection-manager";
import { ActionHandler, MediaAction } from "../core/action-handler";
import { ShortcutManager } from "../core/shortcut-manager";
import { IntentClassifier } from "../core/intent-classifier";
import { MediaObserver } from "../observers/media-observer";
import { SpeedArbiter } from "../core/speed-arbiter";
import { formatRate, MIN_SPEED, MIN_OVERLAY_WIDTH, MIN_OVERLAY_HEIGHT, RateSource } from "../core/constants";
import { VelocityControllerElement, registerVelocityController } from "../ui/overlay/velocity-controller";
import { HUDToastElement, registerHUDToast } from "../ui/overlay/hud-toast";
import { FullscreenObserver } from "../observers/fullscreen-observer";
import { SiteHandlerRegistry } from "../sites/registry";
import { YouTubeHandler } from "../sites/youtube";
import { NetflixHandler } from "../sites/netflix";

class VelocityMainRuntime {
  private settings: SettingsV1 = DEFAULT_SETTINGS;
  private siteRuleEngine = new SiteRuleEngine(this.settings);
  private mediaRegistry = new MediaRegistry();
  private selectionManager = new SelectionManager(this.mediaRegistry);
  private intentClassifier = new IntentClassifier();
  private actionHandler: ActionHandler;
  private shortcutManager: ShortcutManager;
  private mediaObserver: MediaObserver;
  private fullscreenObserver: FullscreenObserver;
  private siteHandlerRegistry = new SiteHandlerRegistry();

  private arbiters = new WeakMap<HTMLMediaElement, SpeedArbiter>();
  private overlays = new WeakMap<HTMLMediaElement, VelocityControllerElement>();
  private toasts = new WeakMap<HTMLMediaElement, HUDToastElement>();

  constructor() {
    registerVelocityController();
    registerHUDToast();

    this.siteHandlerRegistry.register(new YouTubeHandler());
    this.siteHandlerRegistry.register(new NetflixHandler());

    this.actionHandler = new ActionHandler(this.selectionManager, {
      onOverlayToggle: () => this.toggleAllOverlays(),
      onActionExecuted: (action, targetController) => this.handleActionExecuted(action, targetController),
    });

    this.shortcutManager = new ShortcutManager(this.actionHandler, this.settings.shortcuts);

    this.mediaObserver = new MediaObserver({
      onMediaFound: (el) => this.handleMediaFound(el),
      onMediaRemoved: (el) => this.handleMediaRemoved(el),
    });

    this.fullscreenObserver = new FullscreenObserver((isFullscreen, fsElem) => {
      this.handleFullscreenChange(isFullscreen, fsElem);
    });
  }

  init(): void {
    this.bindBridgeListeners();
    this.shortcutManager.attach();
    this.mediaObserver.observe();
    // Dispatch ready event to isolated world bridge
    window.dispatchEvent(new CustomEvent("velocity:main:ready"));
  }
  private bindBridgeListeners(): void {
    window.addEventListener("velocity:settings:init", (e: Event) => {
      const customEvt = e as CustomEvent<SettingsV1>;
      if (customEvt.detail) {
        this.applySettings(customEvt.detail);
      }
    });

    window.addEventListener("velocity:settings:update", (e: Event) => {
      const customEvt = e as CustomEvent<SettingsV1>;
      if (customEvt.detail) {
        this.applySettings(customEvt.detail);
      }
    });

    window.addEventListener("velocity:action:execute", (e: Event) => {
      const customEvt = e as CustomEvent<MediaAction>;
      if (customEvt.detail) {
        this.actionHandler.execute(customEvt.detail);
      }
    });

    window.addEventListener("velocity:status:query", (e: Event) => {
      const customEvt = e as CustomEvent<{ nonce: string }>;
      const nonce = customEvt.detail?.nonce;
      if (!nonce) return;

      const activeCtrl = this.selectionManager.getActiveController();
      const allControllers = this.mediaRegistry.getAll();

      window.dispatchEvent(
        new CustomEvent(`velocity:status:reply:${nonce}`, {
          detail: {
            hasMedia: allControllers.length > 0,
            mediaCount: allControllers.length,
            activeRate: activeCtrl ? activeCtrl.desiredRate : this.settings.defaultSpeed,
            activeMuted: activeCtrl ? activeCtrl.media.muted : false,
            activePaused: activeCtrl ? activeCtrl.media.paused : true,
          },
        })
      );
    });
  }

  private applySettings(newSettings: SettingsV1): void {
    this.settings = newSettings;
    this.siteRuleEngine.updateSettings(newSettings);
    this.shortcutManager.setShortcuts(newSettings.shortcuts);
    const siteConfig = this.siteRuleEngine.resolveSiteConfig(window.location);

    for (const ctrl of this.mediaRegistry.getAll()) {
      const arbiter = this.arbiters.get(ctrl.media);
      if (arbiter) {
        arbiter.fightAutomaticResets = newSettings.compatibility.fightAutomaticRateReset;
      }

      const overlay = this.overlays.get(ctrl.media);
      if (overlay) {
        overlay.setVisible(siteConfig.overlayEnabled && !this.settings.startHidden);
        overlay.setPosition(newSettings.overlay.position);
      }
    }
  }

  private handleActionExecuted(action: MediaAction, targetController: MediaController | null): void {
    if (!targetController) return;
    const toast = this.toasts.get(targetController.media);
    if (!toast) return;

    switch (action.type) {
      case "speed.increase":
      case "speed.decrease":
      case "speed.set":
      case "speed.reset":
      case "speed.preferred.toggle": {
        const rateStr = formatRate(targetController.desiredRate);
        toast.show(`${rateStr}×`, "");
        break;
      }
      case "seek.relative": {
        const sign = action.seconds >= 0 ? "+" : "";
        toast.show(`${sign}${action.seconds}s`, "⏩");
        break;
      }
      case "marker.set": {
        toast.show("Marker Set", "📍");
        break;
      }
      case "marker.jump": {
        toast.show("Jumped to Marker", "🎯");
        break;
      }
      case "audio.boost.increase":
      case "audio.boost.decrease":
      case "audio.boost.set": {
        const gainPct = Math.round(targetController.getAudioGain() * 100);
        toast.show(`Gain: ${gainPct}%`, "🔊");
        break;
      }
      case "pitch.toggle": {
        const pitch = targetController ? targetController.preservesPitch : true;
        toast.show(pitch ? "Pitch Preserved" : "Natural Pitch", "🎵");
        break;
      }
      case "pip.toggle":
        toast.show("Picture-in-Picture", "🖼️");
        break;
      case "silence.skip.toggle": {
        const enabled = targetController ? targetController.silenceSkipEnabled : false;
        toast.show(enabled ? "Silence Skip On" : "Silence Skip Off", "⏩");
        break;
      }
    }
  }

  private handleMediaFound(media: HTMLMediaElement): void {
    if (this.mediaRegistry.get(media)) return;
    if (media.tagName.toLowerCase() === "audio" && this.settings.audioBoolean === false) {
      return;
    }

    const siteConfig = this.siteRuleEngine.resolveSiteConfig(window.location);
    if (!siteConfig.enabled) return;
    const arbiter = new SpeedArbiter(
      siteConfig.initialSpeed,
      this.settings.compatibility.fightAutomaticRateReset
    );
    this.arbiters.set(media, arbiter);

    const siteHandler = this.siteHandlerRegistry.findHandler(window.location);

    const controller = this.mediaRegistry.register(media, siteConfig.initialSpeed, {
      onRateChange: (ctrl, observedRate, source) => {
        const siteSource = siteHandler?.classifyRateChange?.(new Event("ratechange"), ctrl.media);
        const isUserIntent = this.intentClassifier.isRecentInteraction();
        const fromExtension = source === "extension";

        const decision = arbiter.observeRateChange(observedRate, isUserIntent, fromExtension, siteSource);

        if (decision.type === "restore") {
          ctrl.setRate(decision.rate, "restored");
        } else if (decision.type === "accept") {
          if (
            siteConfig.rememberSpeed &&
            decision.source !== "site-automatic" &&
            decision.source !== "temporary-hold" &&
            decision.rate >= MIN_SPEED
          ) {
            window.dispatchEvent(
              new CustomEvent("velocity:storage:save-last-speed", {
                detail: { speed: decision.rate, domain: window.location.hostname },
              })
            );
          }
        }

        const overlay = this.overlays.get(media);
        overlay?.updateRateDisplay(ctrl.desiredRate);
      },
      onDestroy: (ctrl) => {
        const overlay = this.overlays.get(ctrl.media);
        overlay?.destroy();
        const toast = this.toasts.get(ctrl.media);
        toast?.destroy();
        this.overlays.delete(ctrl.media);
        this.toasts.delete(ctrl.media);
        this.arbiters.delete(ctrl.media);
      },
    });

    // Notify site handler
    siteHandler?.onMediaAdded?.(media, controller);

    // Mount toast for visual feedback
    this.mountToast(media);

    // Mount overlay if eligible
    if (siteConfig.overlayEnabled && this.isEligibleForOverlay(media)) {
      const overlay = this.mountOverlay(media, controller);
      if (this.settings.startHidden && overlay) {
        overlay.setVisible(false);
      }
    }
  }

  private handleMediaRemoved(media: HTMLMediaElement): void {
    const ctrl = this.mediaRegistry.get(media);
    if (ctrl) {
      ctrl.destroy();
    }
  }

  private isEligibleForOverlay(media: HTMLMediaElement): boolean {
    if (media.tagName.toLowerCase() === "audio") return false;
    const rect = media.getBoundingClientRect();
    if (rect.width > 0 && rect.width < MIN_OVERLAY_WIDTH && rect.height > 0 && rect.height < MIN_OVERLAY_HEIGHT) {
      return false; // Skip tiny tracker or banner videos
    }
    return true;
  }

  private mountOverlay(media: HTMLMediaElement, controller: MediaController): VelocityControllerElement | null {
    if (this.overlays.has(media)) return this.overlays.get(media) ?? null;

    // Find closest container wrapper or player shell from site handler
    const siteHandler = this.siteHandlerRegistry.findHandler(window.location);
    const container = (siteHandler?.getMediaContainer?.(media) || media.parentElement || media.parentNode) as HTMLElement | null;
    if (!container) return null;

    // Ensure container has relative/absolute positioning context
    const computed = window.getComputedStyle(container);
    if (computed.position === "static") {
      container.style.position = "relative";
    }

    const overlay = new VelocityControllerElement();
    container.appendChild(overlay);

    overlay.attachController(controller, container, this.settings.overlay.position);
    this.overlays.set(media, overlay);
    return overlay;
  }
  private mountToast(media: HTMLMediaElement): HUDToastElement | null {
    if (this.toasts.has(media)) return this.toasts.get(media) ?? null;
    const siteHandler = this.siteHandlerRegistry.findHandler(window.location);
    const container = (siteHandler?.getMediaContainer?.(media) || media.parentElement || media.parentNode) as HTMLElement | null;
    if (!container) return null;

    const toast = new HUDToastElement();
    container.appendChild(toast);
    this.toasts.set(media, toast);
    return toast;
  }


  private toggleAllOverlays(): void {
    for (const ctrl of this.mediaRegistry.getAll()) {
      const overlay = this.overlays.get(ctrl.media);
      if (overlay) {
        const isHidden = overlay.getAttribute("data-hidden") === "true";
        overlay.setVisible(isHidden);
      }
    }
  }

  private handleFullscreenChange(_isFullscreen: boolean, fsElem: Element | null): void {
    if (!fsElem) return;

    for (const ctrl of this.mediaRegistry.getAll()) {
      const overlay = this.overlays.get(ctrl.media);
      if (overlay && ctrl.media.parentElement) {
        overlay.updatePositionStyles();
      }
    }
  }
}

// Start main world runtime
const runtime = new VelocityMainRuntime();
runtime.init();
