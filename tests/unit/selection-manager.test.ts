import { describe, it, expect } from "vitest";
import { MediaRegistry } from "@/core/media-registry";
import { SelectionManager } from "@/core/selection-manager";

describe("SelectionManager", () => {
  it("returns null when registry has no media", () => {
    const registry = new MediaRegistry();
    const manager = new SelectionManager(registry);
    expect(manager.getActiveController()).toBeNull();
  });

  it("returns the only media if only one exists", () => {
    const registry = new MediaRegistry();
    const video = document.createElement("video");
    document.body.appendChild(video);

    const ctrl = registry.register(video);
    const manager = new SelectionManager(registry);

    expect(manager.getActiveController()).toBe(ctrl);
  });

  it("prefers playing media over paused media", () => {
    const registry = new MediaRegistry();
    const video1 = document.createElement("video");
    const video2 = document.createElement("video");
    document.body.appendChild(video1);
    document.body.appendChild(video2);

    Object.defineProperty(video1, "paused", { value: true, configurable: true });
    Object.defineProperty(video2, "paused", { value: false, configurable: true });
    Object.defineProperty(video2, "readyState", { value: 4, configurable: true });

    const ctrl1 = registry.register(video1);
    const ctrl2 = registry.register(video2);
    // Align interaction times so playing state differentiates
    ctrl1.lastInteractionAt = 0;
    ctrl2.lastInteractionAt = 0;

    const manager = new SelectionManager(registry);
    expect(manager.getActiveController()).toBe(ctrl2);
  });

  it("prefers recently user-interacted media", () => {
    const registry = new MediaRegistry();
    const video1 = document.createElement("video");
    const video2 = document.createElement("video");
    document.body.appendChild(video1);
    document.body.appendChild(video2);

    const ctrl1 = registry.register(video1);
    const ctrl2 = registry.register(video2);

    ctrl1.lastInteractionAt = Date.now() - 60000; // 1 min ago
    ctrl2.lastInteractionAt = Date.now(); // right now

    const manager = new SelectionManager(registry);
    expect(manager.getActiveController()).toBe(ctrl2);
  });

  it("penalizes muted or zero-volume background videos", () => {
    const registry = new MediaRegistry();
    const bgVideo = document.createElement("video");
    const mainVideo = document.createElement("video");
    document.body.appendChild(bgVideo);
    document.body.appendChild(mainVideo);

    bgVideo.muted = true;
    mainVideo.muted = false;

    const ctrlBg = registry.register(bgVideo);
    const ctrlMain = registry.register(mainVideo);

    ctrlBg.lastInteractionAt = 0;
    ctrlMain.lastInteractionAt = 0;

    const manager = new SelectionManager(registry);
    expect(manager.getActiveController()).toBe(ctrlMain);
  });

  it("prefers large main video over small muted playing preview", () => {
    const registry = new MediaRegistry();
    const previewVideo = document.createElement("video");
    const mainVideo = document.createElement("video");
    document.body.appendChild(previewVideo);
    document.body.appendChild(mainVideo);

    // Preview video is playing but small and muted
    Object.defineProperty(previewVideo, "paused", { value: false, configurable: true });
    Object.defineProperty(previewVideo, "readyState", { value: 4, configurable: true });
    previewVideo.muted = true;
    previewVideo.getBoundingClientRect = () => ({
      width: 160,
      height: 90,
      top: 0,
      left: 0,
      right: 160,
      bottom: 90,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Main video is paused but large (1280x720) and unmuted
    Object.defineProperty(mainVideo, "paused", { value: true, configurable: true });
    mainVideo.muted = false;
    mainVideo.getBoundingClientRect = () => ({
      width: 1280,
      height: 720,
      top: 0,
      left: 0,
      right: 1280,
      bottom: 720,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const ctrlPreview = registry.register(previewVideo);
    const ctrlMain = registry.register(mainVideo);
    ctrlPreview.lastInteractionAt = 0;
    ctrlMain.lastInteractionAt = 0;

    const manager = new SelectionManager(registry);
    expect(manager.getActiveController()).toBe(ctrlMain);
  });
});
