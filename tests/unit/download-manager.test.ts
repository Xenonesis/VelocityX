import { describe, it, expect } from "vitest";
// @ts-ignore
import { DownloadManager } from "../../website/js/download-manager.js";

describe("DownloadManager Platform Detection & Routing", () => {
  const manager = new DownloadManager({ version: "1.0.0" });

  it("detects Firefox user agents", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0";
    expect(manager.detectPlatform(ua)).toBe("firefox");
  });

  it("detects Edge user agents", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
    expect(manager.detectPlatform(ua)).toBe("edge");
  });

  it("defaults standard Chrome / Chromium user agents to chrome", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
    expect(manager.detectPlatform(ua)).toBe("chrome");
  });

  it("generates correct download metadata and target zip path for Chrome", () => {
    const meta = manager.getDownloadMeta("chrome");
    expect(meta.filename).toBe("velocityx-chrome-v1.0.0.zip");
    expect(meta.url).toBe("assets/downloads/velocityx-chrome-v1.0.0.zip");
    expect(meta.title).toContain("Chrome");
  });

  it("generates correct download metadata and target zip path for Firefox", () => {
    const meta = manager.getDownloadMeta("firefox");
    expect(meta.filename).toBe("velocityx-firefox-v1.0.0.zip");
    expect(meta.url).toBe("assets/downloads/velocityx-firefox-v1.0.0.zip");
    expect(meta.title).toContain("Firefox");
  });
});
