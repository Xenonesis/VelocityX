import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MediaObserver } from "@/observers/media-observer";

describe("MediaObserver", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("finds existing media elements on initial observe", () => {
    const video = document.createElement("video");
    const audio = document.createElement("audio");
    container.appendChild(video);
    container.appendChild(audio);

    const found: HTMLMediaElement[] = [];
    const observer = new MediaObserver({
      onMediaFound: (el) => found.push(el),
    });

    observer.observe(container);
    expect(found).toHaveLength(2);
    expect(found).toContain(video);
    expect(found).toContain(audio);

    observer.disconnect();
  });

  it("detects dynamically inserted media subtrees", async () => {
    const found: HTMLMediaElement[] = [];
    const observer = new MediaObserver({
      onMediaFound: (el) => found.push(el),
    });

    observer.observe(container);

    // Append nested wrapper with video
    const wrapper = document.createElement("div");
    const dynVideo = document.createElement("video");
    wrapper.appendChild(dynVideo);
    container.appendChild(wrapper);

    // Drain microtasks for MutationObserver delivery
    await Promise.resolve();
    expect(found).toContain(dynVideo);
    observer.disconnect();
  });

  it("detects media element removals", async () => {
    const video = document.createElement("video");
    container.appendChild(video);

    const removed: HTMLMediaElement[] = [];
    const observer = new MediaObserver({
      onMediaFound: () => {},
      onMediaRemoved: (el) => removed.push(el),
    });

    observer.observe(container);
    video.remove();

    // Drain microtasks for MutationObserver delivery
    await Promise.resolve();
    expect(removed).toContain(video);
    observer.disconnect();
  });
});
