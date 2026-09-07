import { describe, it, expect, beforeEach } from "vitest";
// @ts-ignore
import { HeroSimulator } from "../../website/js/hero-simulator.js";

describe("HeroSimulator Interactive Playback & Shortcut Engine", () => {
  let video: HTMLVideoElement;
  let sim: InstanceType<typeof HeroSimulator>;

  beforeEach(() => {
    video = document.createElement("video");
    sim = new HeroSimulator(video, { defaultSpeed: 1.0, speedStep: 0.1 });
  });

  it("increases and decreases playback rate within bounds", () => {
    sim.adjustRate(0.1);
    expect(video.playbackRate).toBeCloseTo(1.1);

    sim.adjustRate(-0.3);
    expect(video.playbackRate).toBeCloseTo(0.8);
  });

  it("resets rate to 1.0x and toggles back to previous rate on repeated reset", () => {
    sim.setRate(2.5);
    sim.resetRate();
    expect(video.playbackRate).toBe(1.0);

    // Toggle memory restore
    sim.resetRate();
    expect(video.playbackRate).toBeCloseTo(2.5);
  });

  it("handles keyboard shortcuts accurately", () => {
    sim.handleKey({ code: "KeyD", preventDefault: () => {} });
    expect(video.playbackRate).toBeCloseTo(1.1);

    sim.handleKey({ code: "KeyS", preventDefault: () => {} });
    expect(video.playbackRate).toBeCloseTo(1.0);
  });

  it("toggles silence skip mode", () => {
    expect(sim.silenceSkipEnabled).toBe(false);
    sim.toggleSilenceSkip();
    expect(sim.silenceSkipEnabled).toBe(true);
  });
});
