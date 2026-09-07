import { describe, it, expect } from "vitest";
import { SiteHandlerRegistry } from "@/sites/registry";
import { YouTubeHandler } from "@/sites/youtube";
import { NetflixHandler } from "@/sites/netflix";

describe("Site Handlers & Registry", () => {
  it("registers and discovers site handlers by location", () => {
    const registry = new SiteHandlerRegistry();
    const ytHandler = new YouTubeHandler();
    const nfHandler = new NetflixHandler();

    registry.register(ytHandler);
    registry.register(nfHandler);

    expect(registry.findHandler({ hostname: "www.youtube.com" } as Location)).toBe(ytHandler);
    expect(registry.findHandler({ hostname: "netflix.com" } as Location)).toBe(nfHandler);
    expect(registry.findHandler({ hostname: "vimeo.com" } as Location)).toBeNull();
  });

  it("resolves YouTube media container to #movie_player", () => {
    const ytHandler = new YouTubeHandler();

    const moviePlayer = document.createElement("div");
    moviePlayer.id = "movie_player";
    const innerWrapper = document.createElement("div");
    const video = document.createElement("video");

    innerWrapper.appendChild(video);
    moviePlayer.appendChild(innerWrapper);
    document.body.appendChild(moviePlayer);

    const container = ytHandler.getMediaContainer(video);
    expect(container).toBe(moviePlayer);

    moviePlayer.remove();
  });

  it("resolves Netflix media container to .watch-video", () => {
    const nfHandler = new NetflixHandler();

    const watchVideo = document.createElement("div");
    watchVideo.className = "watch-video";
    const video = document.createElement("video");

    watchVideo.appendChild(video);
    document.body.appendChild(watchVideo);

    const container = nfHandler.getMediaContainer(video);
    expect(container).toBe(watchVideo);

    watchVideo.remove();
  });

  it("classifies YouTube 2x hold gesture as site-user", () => {
    const ytHandler = new YouTubeHandler();
    const video = document.createElement("video");

    // Initially no pointer down
    expect(ytHandler.classifyRateChange(new Event("ratechange"), video)).toBeUndefined();

    // Simulate pointerdown
    video.playbackRate = 2.0;
    (ytHandler as unknown as { isPointerHolding: boolean }).isPointerHolding = true;
    expect(ytHandler.classifyRateChange(new Event("ratechange"), video)).toBe("site-user");
  });
});
