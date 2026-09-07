import { describe, it, expect, vi } from "vitest";
import { MediaController } from "@/core/media-controller";
import { MIN_SPEED, MAX_SPEED } from "@/core/constants";

describe("MediaController", () => {
  function createMockVideo(): HTMLVideoElement {
    const video = document.createElement("video");
    Object.defineProperty(video, "duration", { value: 120, writable: true, configurable: true });
    return video;
  }

  it("initializes with requested rate and clamps bounds", () => {
    const video = createMockVideo();
    const ctrl = new MediaController(video, 1.5);

    expect(ctrl.desiredRate).toBe(1.5);
    expect(video.playbackRate).toBe(1.5);

    const extreme = new MediaController(createMockVideo(), 50);
    expect(extreme.desiredRate).toBe(MAX_SPEED);

    const subMin = new MediaController(createMockVideo(), 0.001);
    expect(subMin.desiredRate).toBe(MIN_SPEED);
  });

  it("increases and decreases rate with step", () => {
    const video = createMockVideo();
    const ctrl = new MediaController(video, 1.0);

    ctrl.increaseRate(0.1);
    expect(ctrl.desiredRate).toBe(1.1);
    expect(video.playbackRate).toBe(1.1);

    ctrl.decreaseRate(0.2);
    expect(ctrl.desiredRate).toBe(0.9);
    expect(video.playbackRate).toBe(0.9);
  });

  it("resets rate to 1.0 or custom reset target with toggle memory", () => {
    const video = createMockVideo();
    const ctrl = new MediaController(video, 2.5);

    ctrl.resetRate();
    expect(ctrl.desiredRate).toBe(1.0);

    // Pressing reset again while at target toggles back to previous (2.5)
    ctrl.resetRate();
    expect(ctrl.desiredRate).toBe(2.5);

    ctrl.resetRate(1.25);
    expect(ctrl.desiredRate).toBe(1.25);
  });
  it("toggles preferred rate back and forth", () => {
    const video = createMockVideo();
    const ctrl = new MediaController(video, 1.25);

    // Toggle to preferred (1.8)
    ctrl.togglePreferredRate(1.8);
    expect(ctrl.desiredRate).toBe(1.8);

    // Toggle again returns to previous (1.25)
    ctrl.togglePreferredRate(1.8);
    expect(ctrl.desiredRate).toBe(1.25);
  });

  it("seeks relatively with bounds clamping", () => {
    const video = createMockVideo();
    video.currentTime = 50;
    const ctrl = new MediaController(video);

    ctrl.seekBy(10);
    expect(video.currentTime).toBe(60);

    ctrl.seekBy(-20);
    expect(video.currentTime).toBe(40);

    // Lower bound at 0
    ctrl.seekBy(-100);
    expect(video.currentTime).toBe(0);

    // Upper bound at duration (120)
    ctrl.seekBy(200);
    expect(video.currentTime).toBe(120);
  });
  it("saves temporal marker and jumps to it with position toggle", () => {
    const video = createMockVideo();
    video.currentTime = 35;
    const ctrl = new MediaController(video);

    ctrl.setMarker();
    expect(ctrl.markerTime).toBe(35);

    video.currentTime = 80;
    ctrl.jumpToMarker();
    expect(video.currentTime).toBe(35);

    // Jumping again while at marker toggles back to pre-jump position (80)
    ctrl.jumpToMarker();
    expect(video.currentTime).toBe(80);
  });
  it("cleans up event listeners completely on destroy", () => {
    const video = createMockVideo();
    const onRateChange = vi.fn();
    const ctrl = new MediaController(video, 1.0, { onRateChange });

    video.dispatchEvent(new Event("ratechange"));
    expect(onRateChange).toHaveBeenCalledTimes(1);

    ctrl.destroy();
    expect(ctrl.destroyed).toBe(true);

    video.dispatchEvent(new Event("ratechange"));
    // Listener was aborted, should still be 1
    expect(onRateChange).toHaveBeenCalledTimes(1);
  });
});
