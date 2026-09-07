import { describe, it, expect, vi, beforeEach } from "vitest";
import { HUDToastElement, registerHUDToast } from "@/ui/overlay/hud-toast";
import { AudioBooster, setMediaPreservesPitch } from "@/utils/audio-boost";
import { SiteRuleEngine } from "@/core/site-rule-engine";
import { DEFAULT_SETTINGS } from "@/storage/defaults";
import { MediaRegistry } from "@/core/media-registry";
import { SelectionManager } from "@/core/selection-manager";
import { ActionHandler } from "@/core/action-handler";

describe("Enhancements: HUDToastElement", () => {
  beforeEach(() => {
    registerHUDToast();
  });

  it("creates custom element and toggles visibility on show()", () => {
    const toast = new HUDToastElement();
    document.body.appendChild(toast);

    expect(toast.classList.contains("visible")).toBe(false);

    toast.show("2.00x", "⚡", 500);
    expect(toast.classList.contains("visible")).toBe(true);

    toast.destroy();
  });
});

describe("Enhancements: Domain Speed Memory in SiteRuleEngine", () => {
  it("resolves domain-specific saved speed when rememberSpeed is true", () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.rememberPlaybackSpeed = true;
    settings.defaultSpeed = 1.0;
    settings.domainSpeeds = {
      "youtube.com": 1.75,
      "coursera.org": 2.25,
    };

    const engine = new SiteRuleEngine(settings);

    const ytConfig = engine.resolveSiteConfig("https://youtube.com/watch?v=123");
    expect(ytConfig.initialSpeed).toBe(1.75);

    const courseraConfig = engine.resolveSiteConfig("https://coursera.org/learn/math");
    expect(courseraConfig.initialSpeed).toBe(2.25);

    // Other domains fall back to global default
    const otherConfig = engine.resolveSiteConfig("https://vimeo.com/456");
    expect(otherConfig.initialSpeed).toBe(1.0);
  });
});

describe("Enhancements: AudioBooster & Pitch Preservation", () => {
  it("clamps gain multiplier between 1.0 and 5.0", () => {
    const video = document.createElement("video");
    const booster = new AudioBooster(video);

    booster.setGain(2.5);
    expect(booster.getGain()).toBe(2.5);

    booster.setGain(10.0);
    expect(booster.getGain()).toBe(5.0);

    booster.setGain(0.2);
    expect(booster.getGain()).toBe(1.0);

    booster.destroy();
  });

  it("sets preservesPitch across standard and vendor prefixes", () => {
    const video = document.createElement("video");
    setMediaPreservesPitch(video, true);
    expect(video.preservesPitch).toBe(true);

    setMediaPreservesPitch(video, false);
    expect(video.preservesPitch).toBe(false);
  });
});

describe("Enhancements: ActionHandler (Audio Boost, Pitch & PiP)", () => {
  it("dispatches audio boost, pitch, and pip actions to active controller", () => {
    const video = document.createElement("video");
    Object.defineProperty(video, "requestPictureInPicture", {
      value: vi.fn().mockResolvedValue({}),
      writable: true,
    });
    const registry = new MediaRegistry();
    const ctrl = registry.register(video, 1.0);
    const selection = new SelectionManager(registry);
    let executedAction: unknown = null;
    const handler = new ActionHandler(selection, {
      onActionExecuted: (action) => {
        executedAction = action;
      },
    });

    // Audio boost increase
    handler.execute({ type: "audio.boost.increase", step: 0.5 });
    expect(ctrl.getAudioGain()).toBe(1.5);
    expect(executedAction).toEqual({ type: "audio.boost.increase", step: 0.5 });

    // Pitch toggle
    const initialPitch = ctrl.preservesPitch;
    handler.execute({ type: "pitch.toggle" });
    expect(ctrl.preservesPitch).toBe(!initialPitch);

    // PiP toggle
    const handledPiP = handler.execute({ type: "pip.toggle" });
    expect(handledPiP).toBe(true);

    ctrl.destroy();
  });
});
