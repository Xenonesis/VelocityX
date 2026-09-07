import { describe, it, expect, vi } from "vitest";
import { MediaRegistry } from "@/core/media-registry";

describe("MediaRegistry", () => {
  function createVideo(): HTMLVideoElement {
    const video = document.createElement("video");
    document.body.appendChild(video);
    return video;
  }

  it("registers media and returns a MediaController", () => {
    const registry = new MediaRegistry();
    const video = createVideo();

    const ctrl = registry.register(video, 1.25);
    expect(ctrl).toBeDefined();
    expect(ctrl.media).toBe(video);
    expect(ctrl.desiredRate).toBe(1.25);

    expect(registry.get(video)).toBe(ctrl);
    expect(registry.getAll()).toHaveLength(1);
  });

  it("is idempotent when registering the same media element twice", () => {
    const registry = new MediaRegistry();
    const video = createVideo();

    const ctrl1 = registry.register(video, 1.0);
    const ctrl2 = registry.register(video, 2.0);

    expect(ctrl1).toBe(ctrl2);
    expect(registry.getAll()).toHaveLength(1);
  });

  it("removes controller automatically when destroyed", () => {
    const onUnregistered = vi.fn();
    const registry = new MediaRegistry({ onUnregistered });
    const video = createVideo();

    const ctrl = registry.register(video);
    expect(registry.getAll()).toHaveLength(1);

    ctrl.destroy();
    expect(registry.getAll()).toHaveLength(0);
    expect(onUnregistered).toHaveBeenCalledWith(ctrl);
  });

  it("unregisters media element explicitly", () => {
    const registry = new MediaRegistry();
    const video = createVideo();

    const ctrl = registry.register(video);
    registry.unregister(video);

    expect(ctrl.destroyed).toBe(true);
    expect(registry.get(video)).toBeUndefined();
    expect(registry.getAll()).toHaveLength(0);
  });
});
