import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { syncWebsiteAssets } from "../../scripts/sync-website-assets";

describe("Website Asset Sync Engine", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vx-sync-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("copies release zips and icons into website assets target directory", () => {
    const mockReleaseDir = path.join(tempDir, "release");
    const mockIconsDir = path.join(tempDir, "icons");
    const targetWebsiteDir = path.join(tempDir, "website");

    fs.mkdirSync(mockReleaseDir, { recursive: true });
    fs.mkdirSync(mockIconsDir, { recursive: true });
    fs.writeFileSync(path.join(mockReleaseDir, "velocityx-chrome-v1.0.0.zip"), "dummy-chrome-zip");
    fs.writeFileSync(path.join(mockReleaseDir, "velocityx-firefox-v1.0.0.zip"), "dummy-firefox-zip");
    fs.writeFileSync(path.join(mockIconsDir, "icon-16.png"), "dummy-icon-16");

    const result = syncWebsiteAssets({
      releaseDir: mockReleaseDir,
      iconsDir: mockIconsDir,
      websiteDir: targetWebsiteDir,
    });

    expect(result.syncedFiles.length).toBe(3);
    expect(fs.existsSync(path.join(targetWebsiteDir, "assets/downloads/velocityx-chrome-v1.0.0.zip"))).toBe(true);
    expect(fs.existsSync(path.join(targetWebsiteDir, "assets/downloads/velocityx-firefox-v1.0.0.zip"))).toBe(true);
    expect(fs.existsSync(path.join(targetWebsiteDir, "assets/icons/icon-16.png"))).toBe(true);
  });
});
