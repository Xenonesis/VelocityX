import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

describe("Website Landing Page DOM Contract Verification", () => {
  const htmlPath = path.join(process.cwd(), "website", "index.html");
  const cssPath = path.join(process.cwd(), "website", "styles.css");
  const appJsPath = path.join(process.cwd(), "website", "app.js");
  const videoPath = path.join(process.cwd(), "website", "assets", "demo", "sample.mp4");

  it("ensures all core files exist and are populated", () => {
    expect(fs.existsSync(htmlPath)).toBe(true);
    expect(fs.existsSync(cssPath)).toBe(true);
    expect(fs.existsSync(appJsPath)).toBe(true);
    expect(fs.existsSync(videoPath)).toBe(true);

    expect(fs.statSync(htmlPath).size).toBeGreaterThan(1000);
    expect(fs.statSync(cssPath).size).toBeGreaterThan(1000);
    expect(fs.statSync(appJsPath).size).toBeGreaterThan(1000);
    expect(fs.statSync(videoPath).size).toBeGreaterThan(1000);
  });

  it("contains all required elements and IDs for DownloadManager, HeroSimulator, and InstallModal", () => {
    const htmlContent = fs.readFileSync(htmlPath, "utf-8");
    const dom = new JSDOM(htmlContent);
    const doc = dom.window.document;

    // DownloadManager elements
    expect(doc.getElementById("primary-download-btn")).not.toBeNull();
    expect(doc.getElementById("primary-download-text")).not.toBeNull();
    expect(doc.getElementById("download-dropdown")).not.toBeNull();
    expect(doc.querySelectorAll("#download-dropdown [data-platform]").length).toBeGreaterThanOrEqual(2);

    // InstallModal elements
    expect(doc.getElementById("open-install-guide-btn")).not.toBeNull();
    expect(doc.getElementById("install-modal")).not.toBeNull();
    expect(doc.querySelector("#install-modal .close-btn")).not.toBeNull();
    expect(doc.querySelector('#install-modal [data-target="chrome"]')).not.toBeNull();
    expect(doc.querySelector('#install-modal [data-target="firefox"]')).not.toBeNull();
    expect(doc.querySelectorAll("#install-modal [data-copy]").length).toBeGreaterThanOrEqual(2);

    // HeroSimulator elements
    expect(doc.getElementById("demo-video")).not.toBeNull();
    expect(doc.getElementById("sim-controller")).not.toBeNull();
    expect(doc.getElementById("sim-slower-btn")).not.toBeNull();
    expect(doc.getElementById("sim-faster-btn")).not.toBeNull();
    expect(doc.getElementById("sim-rate-display")).not.toBeNull();
    expect(doc.getElementById("sim-rewind-btn")).not.toBeNull();
    expect(doc.getElementById("sim-forward-btn")).not.toBeNull();
    expect(doc.getElementById("sim-close-btn")).not.toBeNull();

    // Toast elements
    expect(doc.getElementById("sim-toast")).not.toBeNull();
    expect(doc.getElementById("sim-toast-text")).not.toBeNull();
    expect(doc.getElementById("sim-toast-icon")).not.toBeNull();

    // Feature matrix & Keyboard sections
    expect(doc.getElementById("features")).not.toBeNull();
    expect(doc.getElementById("keyboard")).not.toBeNull();
    expect(doc.querySelectorAll(".keycap-card").length).toBeGreaterThanOrEqual(8);
  });
});
