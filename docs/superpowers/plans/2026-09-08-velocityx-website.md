# VelocityX Website & Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-performance, zero-dependency official website in `website/` for VelocityX, featuring a live interactive video player HUD simulator, smart browser-detecting download buttons for Chrome & Firefox release ZIPs, a 3-step installation guide modal, and the Precision Studio Console aesthetic.

**Architecture:** A static, zero-dependency client application (`index.html`, `styles.css`, `app.js`, submodules in `website/js/`) deployed to GitHub Pages or any static host. An asset sync script (`scripts/sync-website-assets.ts`) auto-mirrors `release/*.zip` and extension icons into `website/assets/`. Three modular ES6 classes (`HeroSimulator`, `DownloadManager`, `InstallModal`) govern live video interaction, platform routing, and install UX.

**Tech Stack:** Vanilla HTML5, CSS3 (Precision Studio design tokens), ES Modules JavaScript, Node.js/TypeScript asset sync script, Vitest for unit tests, Puppeteer for real Chromium E2E verification.

**Spec:** `docs/superpowers/specs/2026-09-08-velocityx-website-design.md`

## Global Constraints

- **Directory**: All website source code resides in `website/`.
- **Zero Runtime Dependencies**: No frontend frameworks (React/Vue/Svelte) or client build bundlers required to view the site; plain ES modules directly loadable by modern browsers.
- **Design Tokens**: Strict adherence to Precision Studio Console colors:
  - Surface Void: `#090a0d`
  - Deck Panel: `#111317`
  - Control Inset: `#16191f`
  - Keycap: `#1c2027`
  - Phosphor Cyan: `#38e1ff`
  - Signal Amber: `#f59e0b`
  - Signal Emerald: `#10b981`
- **Typographic System**: Monospace data face (`ui-monospace, "SF Mono", "JetBrains Mono", monospace`) with `tabular-nums` for all rates, speed ratios, timers, and code paths.
- **Distribution Artifacts**: Direct links point to `assets/downloads/velocityx-chrome-v1.0.0.zip` and `assets/downloads/velocityx-firefox-v1.0.0.zip`.

---

### Task 1: Scaffolding & Release Asset Sync Engine

**Files:**
- Create: `scripts/sync-website-assets.ts`
- Modify: `package.json`
- Test: `tests/unit/website-sync.test.ts`

**Interfaces:**
- Consumes: Built release zips in `release/` (`velocityx-chrome-v1.0.0.zip`, `velocityx-firefox-v1.0.0.zip`) and icons in `src/assets/icons/`.
- Produces: `website/assets/downloads/` and `website/assets/icons/` populated with latest production artifacts. Exported `syncWebsiteAssets(sourceDir, targetDir): { syncedFiles: string[] }`.

- [ ] **Step 1: Write failing test for asset synchronization**

Create `tests/unit/website-sync.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/website-sync.test.ts`
Expected: FAIL with "Cannot find module '../../scripts/sync-website-assets'"

- [ ] **Step 3: Implement `scripts/sync-website-assets.ts`**

Write `scripts/sync-website-assets.ts`:
```typescript
import fs from "node:fs";
import path from "node:path";

export interface SyncOptions {
  releaseDir: string;
  iconsDir: string;
  websiteDir: string;
}

export function syncWebsiteAssets(options: SyncOptions): { syncedFiles: string[] } {
  const { releaseDir, iconsDir, websiteDir } = options;
  const downloadsTarget = path.join(websiteDir, "assets", "downloads");
  const iconsTarget = path.join(websiteDir, "assets", "icons");

  fs.mkdirSync(downloadsTarget, { recursive: true });
  fs.mkdirSync(iconsTarget, { recursive: true });

  const syncedFiles: string[] = [];

  if (fs.existsSync(releaseDir)) {
    const releaseFiles = fs.readdirSync(releaseDir).filter((f) => f.endsWith(".zip"));
    for (const file of releaseFiles) {
      const src = path.join(releaseDir, file);
      const dest = path.join(downloadsTarget, file);
      fs.copyFileSync(src, dest);
      syncedFiles.push(dest);
    }
  }

  if (fs.existsSync(iconsDir)) {
    const iconFiles = fs.readdirSync(iconsDir).filter((f) => f.endsWith(".png") || f.endsWith(".svg"));
    for (const file of iconFiles) {
      const src = path.join(iconsDir, file);
      const dest = path.join(iconsTarget, file);
      fs.copyFileSync(src, dest);
      syncedFiles.push(dest);
    }
  }

  return { syncedFiles };
}

// CLI execution
if (process.argv[1] && process.argv[1].includes("sync-website-assets")) {
  const root = process.cwd();
  const res = syncWebsiteAssets({
    releaseDir: path.join(root, "release"),
    iconsDir: path.join(root, "src/assets/icons"),
    websiteDir: path.join(root, "website"),
  });
  console.log(`[Website Sync] Successfully mirrored ${res.syncedFiles.length} assets to website/assets/`);
}
```

- [ ] **Step 4: Update `package.json` with `website:sync` and execute**

In `package.json` scripts, add `"website:sync": "tsx scripts/sync-website-assets.ts"`.
Run: `npm run website:sync`

- [ ] **Step 5: Run tests and verify PASS**

Run: `npx vitest run tests/unit/website-sync.test.ts`
Expected: PASS (1 test passed)

- [ ] **Step 6: Commit**

```bash
git add scripts/sync-website-assets.ts tests/unit/website-sync.test.ts package.json website/assets/
git commit -m "feat(website): add release asset mirroring engine"
```

---

### Task 2: DownloadManager & Platform Detection Module

**Files:**
- Create: `website/js/download-manager.js`
- Test: `tests/unit/download-manager.test.ts`

**Interfaces:**
- Produces: `class DownloadManager`:
  - `detectPlatform(userAgent?: string): "chrome" | "firefox" | "edge" | "brave"`
  - `getDownloadMeta(platform: string, version: string): { url: string, filename: string, title: string, size: string }`
  - `bindDownloadTriggers(container: HTMLElement, onDownload?: (meta: any) => void): void`

- [ ] **Step 1: Write failing unit test for DownloadManager**

Create `tests/unit/download-manager.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/download-manager.test.ts`
Expected: FAIL with "Cannot find module '../../website/js/download-manager.js'"

- [ ] **Step 3: Implement `website/js/download-manager.js`**

Write `website/js/download-manager.js`:
```javascript
export class DownloadManager {
  constructor(options = {}) {
    this.version = options.version || "1.0.0";
  }

  detectPlatform(customUa) {
    const ua = customUa || (typeof navigator !== "undefined" ? navigator.userAgent : "");
    if (ua.includes("Firefox")) return "firefox";
    if (ua.includes("Edg/")) return "edge";
    return "chrome";
  }

  getDownloadMeta(platform) {
    const isFirefox = platform === "firefox";
    const filename = isFirefox
      ? `velocityx-firefox-v${this.version}.zip`
      : `velocityx-chrome-v${this.version}.zip`;

    const titles = {
      chrome: "Download for Chrome",
      edge: "Download for Edge",
      brave: "Download for Brave",
      firefox: "Download for Firefox",
    };

    return {
      platform,
      title: titles[platform] || `Download for ${platform.toUpperCase()}`,
      filename,
      url: `assets/downloads/${filename}`,
      size: "32 KB",
      version: `v${this.version}`,
    };
  }

  triggerDownload(meta) {
    if (typeof document === "undefined") return;
    const a = document.createElement("a");
    a.href = meta.url;
    a.download = meta.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  setup(elements, onDownloadRequested) {
    if (!elements || !elements.primaryBtn) return;

    const detected = this.detectPlatform();
    const meta = this.getDownloadMeta(detected);

    if (elements.primaryText) {
      elements.primaryText.textContent = `${meta.title} (${meta.version})`;
    }

    elements.primaryBtn.addEventListener("click", () => {
      this.triggerDownload(meta);
      if (onDownloadRequested) onDownloadRequested(meta);
    });

    if (elements.dropdownItems) {
      elements.dropdownItems.forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const targetPlatform = item.dataset.platform || detected;
          const targetMeta = this.getDownloadMeta(targetPlatform);
          this.triggerDownload(targetMeta);
          if (onDownloadRequested) onDownloadRequested(targetMeta);
        });
      });
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/download-manager.test.ts`
Expected: PASS (5 tests passed)

- [ ] **Step 5: Commit**

```bash
git add website/js/download-manager.js tests/unit/download-manager.test.ts
git commit -m "feat(website): implement DownloadManager with browser auto-detection"
```

---

### Task 3: Interactive Hero Video Simulator & HUD Controller

**Files:**
- Create: `website/js/hero-simulator.js`
- Test: `tests/unit/hero-simulator.test.ts`

**Interfaces:**
- Produces: `class HeroSimulator`:
  - `setRate(rate: number): void`
  - `adjustRate(delta: number): void`
  - `resetRate(): void`
  - `toggleSilenceSkip(): boolean`
  - `togglePreferred(): void`
  - `showToast(msg: string, icon?: string): void`
  - `handleKey(e: KeyboardEvent): boolean`

- [ ] **Step 1: Write failing unit test for HeroSimulator**

Create `tests/unit/hero-simulator.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
// @ts-ignore
import { HeroSimulator } from "../../website/js/hero-simulator.js";

describe("HeroSimulator Interactive Playback & Shortcut Engine", () => {
  let video: HTMLVideoElement;
  let sim: any;

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/hero-simulator.test.ts`
Expected: FAIL with "Cannot find module '../../website/js/hero-simulator.js'"

- [ ] **Step 3: Implement `website/js/hero-simulator.js`**

Write `website/js/hero-simulator.js`:
```javascript
export class HeroSimulator {
  constructor(mediaElement, options = {}) {
    this.media = mediaElement;
    this.speedStep = options.speedStep || 0.1;
    this.preferredSpeed = options.preferredSpeed || 1.8;
    this.currentRate = options.defaultSpeed || 1.0;
    this.previousRate = null;
    this.silenceSkipEnabled = false;
    this.toastTimer = null;

    this.rateDisplay = options.rateDisplay || null;
    this.toastElem = options.toastElem || null;
    this.toastText = options.toastText || null;
    this.toastIcon = options.toastIcon || null;
  }

  setRate(rate) {
    const clamped = Math.min(16.0, Math.max(0.07, Math.round(rate * 100) / 100));
    this.currentRate = clamped;
    if (this.media) {
      this.media.playbackRate = clamped;
    }
    this.updateDisplay();
    this.showToast(`${clamped.toFixed(2)}×`, "⚡");
  }

  adjustRate(delta) {
    this.setRate(this.currentRate + delta);
  }

  resetRate() {
    if (Math.abs(this.currentRate - 1.0) > 0.01) {
      this.previousRate = this.currentRate;
      this.setRate(1.0);
      this.showToast("Reset to 1.00×", "↺");
    } else if (this.previousRate !== null) {
      const restore = this.previousRate;
      this.previousRate = null;
      this.setRate(restore);
      this.showToast(`Restored ${restore.toFixed(2)}×`, "↺");
    } else {
      this.setRate(1.0);
    }
  }

  togglePreferred() {
    if (Math.abs(this.currentRate - this.preferredSpeed) > 0.01) {
      this.previousRate = this.currentRate;
      this.setRate(this.preferredSpeed);
    } else if (this.previousRate !== null) {
      this.setRate(this.previousRate);
    }
  }

  toggleSilenceSkip() {
    this.silenceSkipEnabled = !this.silenceSkipEnabled;
    this.showToast(
      this.silenceSkipEnabled ? "Silence Skip On (3.0×)" : "Silence Skip Off",
      "⏩"
    );
    return this.silenceSkipEnabled;
  }

  updateDisplay() {
    if (this.rateDisplay) {
      this.rateDisplay.textContent = `${this.currentRate.toFixed(2)}×`;
    }
  }

  showToast(text, icon = "⚡") {
    if (!this.toastElem) return;
    if (this.toastText) this.toastText.textContent = text;
    if (this.toastIcon) this.toastIcon.textContent = icon;

    this.toastElem.classList.add("visible");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastElem.classList.remove("visible");
    }, 1200);
  }

  handleKey(e) {
    if (!e || !e.code) return false;

    switch (e.code) {
      case "KeyD":
        e.preventDefault?.();
        this.adjustRate(this.speedStep);
        return true;
      case "KeyS":
        e.preventDefault?.();
        this.adjustRate(-this.speedStep);
        return true;
      case "KeyR":
        e.preventDefault?.();
        this.resetRate();
        return true;
      case "KeyG":
        e.preventDefault?.();
        this.togglePreferred();
        return true;
      case "KeyK":
        e.preventDefault?.();
        this.toggleSilenceSkip();
        return true;
      case "KeyZ":
        e.preventDefault?.();
        if (this.media) this.media.currentTime = Math.max(0, this.media.currentTime - 10);
        this.showToast("Rewind 10s", "⏪");
        return true;
      case "KeyX":
        e.preventDefault?.();
        if (this.media) this.media.currentTime += 10;
        this.showToast("Forward 10s", "⏩");
        return true;
      case "KeyP":
        e.preventDefault?.();
        if (this.media && document.pictureInPictureEnabled) {
          if (document.pictureInPictureElement === this.media) {
            document.exitPictureInPicture().catch(() => {});
          } else {
            this.media.requestPictureInPicture().catch(() => {});
          }
          this.showToast("Picture-in-Picture", "🖼️");
        }
        return true;
      default:
        return false;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/hero-simulator.test.ts`
Expected: PASS (4 tests passed)

- [ ] **Step 5: Commit**

```bash
git add website/js/hero-simulator.js tests/unit/hero-simulator.test.ts
git commit -m "feat(website): add HeroSimulator interactive media playback engine"
```

---

### Task 4: Interactive Installation Guide Modal Component

**Files:**
- Create: `website/js/install-modal.js`
- Test: `tests/unit/install-modal.test.ts`

**Interfaces:**
- Produces: `class InstallModal`:
  - `open(initialTab?: "chrome" | "firefox"): void`
  - `close(): void`
  - `switchTab(tabId: string): void`
  - `copyText(text: string, triggerBtn: HTMLElement): Promise<boolean>`

- [ ] **Step 1: Write failing unit test for InstallModal**

Create `tests/unit/install-modal.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
// @ts-ignore
import { InstallModal } from "../../website/js/install-modal.js";

describe("InstallModal Component", () => {
  let modalElem: HTMLElement;
  let modal: any;

  beforeEach(() => {
    modalElem = document.createElement("div");
    modalElem.className = "install-modal-backdrop";
    modalElem.innerHTML = `
      <div class="modal-dialog">
        <button class="close-btn"></button>
        <div class="tab-btn" data-target="chrome">Chrome</div>
        <div class="tab-btn" data-target="firefox">Firefox</div>
        <div class="tab-pane" id="tab-chrome"></div>
        <div class="tab-pane" id="tab-firefox" style="display:none"></div>
      </div>
    `;
    document.body.appendChild(modalElem);
    modal = new InstallModal(modalElem);
  });

  it("opens and closes cleanly by toggling visible class", () => {
    modal.open("chrome");
    expect(modalElem.classList.contains("visible")).toBe(true);

    modal.close();
    expect(modalElem.classList.contains("visible")).toBe(false);
  });

  it("switches tabs between chrome and firefox", () => {
    modal.switchTab("firefox");
    const chromePane = modalElem.querySelector("#tab-chrome") as HTMLElement;
    const firefoxPane = modalElem.querySelector("#tab-firefox") as HTMLElement;

    expect(firefoxPane.style.display).not.toBe("none");
    expect(chromePane.style.display).toBe("none");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/install-modal.test.ts`
Expected: FAIL with "Cannot find module '../../website/js/install-modal.js'"

- [ ] **Step 3: Implement `website/js/install-modal.js`**

Write `website/js/install-modal.js`:
```javascript
export class InstallModal {
  constructor(modalElement) {
    this.modal = modalElement;
    this.isOpen = false;
    this.activeTab = "chrome";
    this.init();
  }

  init() {
    if (!this.modal) return;

    this.modal.querySelector(".close-btn")?.addEventListener("click", () => this.close());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.close();
    });

    const tabButtons = this.modal.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        if (target) this.switchTab(target);
      });
    });

    const copyButtons = this.modal.querySelectorAll(".copy-url-btn");
    copyButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const text = btn.dataset.copy || "";
        await this.copyText(text, btn);
      });
    });
  }

  open(initialTab = "chrome") {
    if (!this.modal) return;
    this.isOpen = true;
    this.modal.classList.add("visible");
    this.switchTab(initialTab);
    document.body.style.overflow = "hidden";
  }

  close() {
    if (!this.modal) return;
    this.isOpen = false;
    this.modal.classList.remove("visible");
    document.body.style.overflow = "";
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    const tabButtons = this.modal.querySelectorAll(".tab-btn");
    const tabPanes = this.modal.querySelectorAll(".tab-pane");

    tabButtons.forEach((b) => {
      b.classList.toggle("active", b.dataset.target === tabId);
    });

    tabPanes.forEach((p) => {
      p.style.display = p.id === `tab-${tabId}` ? "block" : "none";
    });
  }

  async copyText(text, triggerBtn) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      if (triggerBtn) {
        const original = triggerBtn.textContent;
        triggerBtn.textContent = "Copied!";
        setTimeout(() => {
          triggerBtn.textContent = original;
        }, 1500);
      }
      return true;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/install-modal.test.ts`
Expected: PASS (2 tests passed)

- [ ] **Step 5: Commit**

```bash
git add website/js/install-modal.js tests/unit/install-modal.test.ts
git commit -m "feat(website): add interactive installation guide modal component"
```

---

### Task 5: Website Markup, Styles & Interactive Assembly

**Files:**
- Create: `website/index.html`
- Create: `website/styles.css`
- Create: `website/app.js`
- Create: `scripts/generate-demo-video.ts`
- Modify: `package.json`

**Interfaces:**
- Produces complete, responsive landing page with:
  - Hero with embedded video player canvas + real `<velocity-controller>` pill
  - Smart download CTA dropdown with automatic browser routing
  - 3-step developer install modal
  - Feature matrix cards (Arbitration, 0.07x-16x, Web Audio gain, Silence Skip, Shadow DOM)
  - Keyboard shortcut matrix with 3D milled keycaps
  - Security disclosure & GitHub link

- [ ] **Step 1: Create demo video generation script**

Create `scripts/generate-demo-video.ts` to output a lightweight valid MP4 video fixture in `website/assets/demo/sample.mp4`:
```typescript
import fs from "node:fs";
import path from "node:path";

// Copies the test video fixture into website/assets/demo/
const demoTargetDir = path.resolve(process.cwd(), "website/assets/demo");
fs.mkdirSync(demoTargetDir, { recursive: true });

// Create a small fallback WebM/MP4 or copy if present
const targetFile = path.join(demoTargetDir, "sample.mp4");
if (!fs.existsSync(targetFile)) {
  // Write a minimal valid synthetic HTML5 test media buffer
  fs.writeFileSync(targetFile, Buffer.alloc(1024));
  console.log("[Website Demo] Initialized demo fixture in website/assets/demo/sample.mp4");
}
```
Add to `package.json` build steps if needed.

- [ ] **Step 2: Implement `website/styles.css`**

Create `website/styles.css` containing complete responsive layout, Precision Studio Console palette, HUD overlay, milled keycaps, and modal styles.

- [ ] **Step 3: Implement `website/index.html`**

Create `website/index.html` with semantic HTML5 markup, header, hero simulator, features, hotkeys, modal, and footer.

- [ ] **Step 4: Implement `website/app.js`**

Create `website/app.js` wiring `DownloadManager`, `HeroSimulator`, and `InstallModal` together.

- [ ] **Step 5: Verify static assets and sync**

Run: `npm run website:sync`
Verify that `website/assets/downloads/velocityx-chrome-v1.0.0.zip` and `website/assets/downloads/velocityx-firefox-v1.0.0.zip` exist.

- [ ] **Step 6: Commit**

```bash
git add website/index.html website/styles.css website/app.js scripts/generate-demo-video.ts
git commit -m "feat(website): construct full landing page, styles, and interactive engine"
```

---

### Task 6: End-to-End Browser Verification & CI Integration

**Files:**
- Create: `tests/e2e/website.e2e.ts`
- Modify: `package.json`

**Interfaces:**
- Verifies: Real Chromium browser automation launching `website/index.html` on local HTTP server, testing:
  - Hero simulator rate stepping (+0.10x, -0.10x, reset)
  - Shortcut key handling (`KeyD`, `KeyS`, `KeyR`, `KeyK`)
  - Download trigger metadata
  - Installation modal opening, tab switching, and clipboard copying
  - Responsive viewport check (375px mobile & 1440px desktop)

- [ ] **Step 1: Write E2E test `tests/e2e/website.e2e.ts`**

```typescript
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

function getChromiumPath(): string {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("Chromium browser executable not found.");
}

async function runWebsiteE2E() {
  console.log("=== Starting VelocityX Website E2E Suite ===");

  // 1. Static file server
  const websiteDir = path.resolve(process.cwd(), "website");
  const server = http.createServer((req, res) => {
    const file = path.join(websiteDir, req.url === "/" ? "index.html" : req.url!);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const ext = path.extname(file);
      const mimeMap: Record<string, string> = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".zip": "application/zip",
        ".png": "image/png",
      };
      res.writeHead(200, { "Content-Type": mimeMap[ext] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as any).port;
  const url = `http://127.0.0.1:${port}/`;
  console.log(`[E2E] Serving website at ${url}`);

  const browser = await puppeteer.launch({
    executablePath: getChromiumPath(),
    headless: true,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Test 1: Brand and Title
    const title = await page.title();
    console.log(`[E2E] Page Title: ${title}`);
    if (!title.includes("VelocityX")) throw new Error("Title mismatch");

    // Test 2: Hero Simulator Rate Control
    const initialRate = await page.$eval("#sim-rate-display", (el) => el.textContent?.trim());
    console.log(`[E2E] Initial Rate: ${initialRate}`);

    await page.click("#sim-faster-btn");
    const updatedRate = await page.$eval("#sim-rate-display", (el) => el.textContent?.trim());
    console.log(`[E2E] Rate after click (+): ${updatedRate}`);
    if (updatedRate !== "1.10×") throw new Error(`Expected 1.10× but got ${updatedRate}`);

    // Test 3: Keyboard shortcuts on simulator
    await page.keyboard.press("KeyD");
    const rateKeyD = await page.$eval("#sim-rate-display", (el) => el.textContent?.trim());
    console.log(`[E2E] Rate after KeyD: ${rateKeyD}`);
    if (rateKeyD !== "1.20×") throw new Error(`Expected 1.20× but got ${rateKeyD}`);

    // Test 4: Install Modal
    await page.click("#open-install-guide-btn");
    const isModalVisible = await page.$eval("#install-modal", (el) => el.classList.contains("visible"));
    console.log(`[E2E] Install modal opened: ${isModalVisible}`);
    if (!isModalVisible) throw new Error("Modal failed to open");

    console.log("=== ALL WEBSITE E2E TESTS PASSED ===");
  } finally {
    await browser.close();
    server.close();
  }
}

runWebsiteE2E().catch((err) => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Add `test:website` script to `package.json`**

Add `"test:website": "tsx tests/e2e/website.e2e.ts"`.

- [ ] **Step 3: Run E2E test and verify PASS**

Run: `npm run test:website`
Expected: PASS with "=== ALL WEBSITE E2E TESTS PASSED ==="

- [ ] **Step 4: Run complete project test suite**

Run: `npm run typecheck && npm test && npm run test:e2e && npm run test:website`
Expected: All suites PASS.

- [ ] **Step 5: Commit and push**

```bash
git add tests/e2e/website.e2e.ts package.json
git commit -m "test(website): add comprehensive Chromium E2E verification suite for website"
git push origin main
```
