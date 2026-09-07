# VelocityX Website & Showcase Design Specification

**Document:** `docs/superpowers/specs/2026-09-08-velocityx-website-design.md`  
**Date:** 2026-09-08  
**Status:** Approved  
**Author:** VelocityX Engineering & Design Studio

---

## 1. Executive Summary & Goals

This specification outlines the architecture, visual identity, interactive simulation engine, and distribution mechanisms for the official **VelocityX** website. The website serves as the primary portal for prospective users, developers, and speed-listeners to:
1. **Experience the Instrument Live**: An interactive in-browser hero simulator demonstrating real-time rate stepping, hotkey capture, silence skipping, and HUD pill controls without installing anything first.
2. **Download Verified Extensions**: Intelligent browser detection with one-click direct ZIP download for Chrome/Chromium and Firefox, plus a platform dropdown selector.
3. **Learn Sideloading & Installation**: A step-by-step interactive installation guide modal for loading unpacked extensions in developer mode across Chrome, Edge, Brave, and Firefox.
4. **Inspect Technical Merits**: Comprehensive breakdown of intelligent rate arbitration, circuit breakers, Web Audio dynamics, closed Shadow DOM encapsulation, and 100% offline privacy architecture.

---

## 2. Visual Identity & Design System (Precision Studio Console)

The website uses the **Precision Studio Console & Telemetry Deck** design language created for VelocityX, avoiding generic web templates (warm cream serif or generic slate/sky blue).

### Color Tokens
- **Surface Void (`--bg-void`)**: `#090a0d` (ultra-deep obsidian base backdrop)
- **Deck Panel (`--bg-deck`)**: `#111317` (milled graphite card surface)
- **Chamber / Inset (`--bg-inset`)**: `#16191f` (sunken control wells)
- **Keycap Surface (`--bg-key`)**: `#1c2027` (tactile keycap fill)
- **Precision Hairline (`--border-subtle`)**: `rgba(255, 255, 255, 0.08)`
- **Frame Highlight (`--border-frame`)**: `rgba(255, 255, 255, 0.16)`
- **Phosphor Cyan (`--signal-cyan`)**: `#38e1ff` (primary telemetry accent and active indicator glow)
- **Signal Amber (`--signal-amber`)**: `#f59e0b` (audio boost stage, gain indicators, fast-forward)
- **Beacon Emerald (`--signal-green`)**: `#10b981` (active video lock, verified release tag)
- **Primary Text (`--text-primary`)**: `#f8fafc`
- **Secondary Text (`--text-secondary`)**: `#94a3b8`
- **Muted Technical (`--text-muted`)**: `#64748b`

### Typography
- **Telemetry & Data Face**: `ui-monospace, "SF Mono", "JetBrains Mono", "Fira Code", Menlo, monospace` with `font-variant-numeric: tabular-nums` for rock-solid rates and timers.
- **Display & UI Face**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`.
- **Milled Keycaps (`<kbd>`)**: 3D beveled appearance (`border-bottom: 2px solid #0d0f12`) representing physical keyboard mechanical switches.

---

## 3. Architecture & Directory Layout

The website is housed in `website/` as a self-contained, zero-dependency static application ready to serve locally or on GitHub Pages / Cloudflare Pages / Vercel:

```
website/
├── index.html            # Semantic HTML5 landing structure & OSD modals
├── styles.css            # Complete design system tokens, responsive grid, animations
├── app.js                # ES module controller (HeroSimulator, DownloadManager, InstallModal)
├── assets/
│   ├── icons/            # SVG vector icons & extension brand glyphs
│   ├── demo/             # Sample video clip (royalty-free HTML5 video fixture)
│   └── downloads/        # Mirrored release zips (velocityx-chrome-v1.0.0.zip, etc.)
```

### Build & Release Sync Integration
A script in `package.json` (`npm run website:sync` or integrated into `scripts/package.ts`) copies:
- `release/velocityx-chrome-v1.0.0.zip` → `website/assets/downloads/velocityx-chrome-v1.0.0.zip`
- `release/velocityx-firefox-v1.0.0.zip` → `website/assets/downloads/velocityx-firefox-v1.0.0.zip`
- Extension icon SVG assets → `website/assets/icons/`

---

## 4. Live Hero Simulator Specification

The Hero section hosts an interactive, functional HTML5 video player simulating the real extension:

### Components & Mechanics
1. **Interactive HUD Overlay (`<div class="sim-controller">`)**:
   - Matches the exact visual appearance of `<velocity-controller>`.
   - Control buttons:
     - `<<` (Rewind 10s): Jumps `video.currentTime -= 10`.
     - `−` (Step Slower): Decreases rate by 0.10× (clamped to 0.07×).
     - `Rate Readout` (e.g. `1.80×`): Displays live tabular rate.
     - `+` (Step Faster): Increases rate by 0.10× (clamped to 16.0×).
     - `>>` (Forward 10s): Jumps `video.currentTime += 10`.
     - `x` (Close/Hide): Temporarily hides overlay; toggled back via `V` key or reset button.
2. **Interactive Shortcut Engine**:
   - Listens to `keydown` events when the simulator is hovered or focused:
     - `KeyD`: Speed up +0.10×.
     - `KeyS`: Speed down −0.10×.
     - `KeyR`: Reset to 1.00× (press again restores previous speed).
     - `KeyG`: Toggle preferred speed (1.80×).
     - `KeyK`: Toggle silence skip simulation (speeds quiet parts to 3.0×).
     - `KeyP`: Toggle Picture-in-Picture.
     - `KeyZ` / `KeyX`: Rewind / Forward 10s.
     - `KeyV`: Toggle HUD visibility.
3. **Simulation HUD Toast (`<div class="sim-toast">`)**:
   - Displays animated OSD status updates ("1.50×", "Reset Speed", "Silence Skip On") using spring physics and frosted glass backdrop blur.
4. **Input Safety Protection**:
   - Ignores keydown events originating from text input fields or search bars.

---

## 5. Smart Download Engine & Platform Detection

### Logic & Flow (`DownloadManager`)
1. **Detection**:
   - Inspects `navigator.userAgentData?.brands` if available, falling back to `navigator.userAgent`.
   - Detects:
     - **Firefox**: `userAgent.includes("Firefox")`
     - **Microsoft Edge**: `userAgent.includes("Edg")`
     - **Brave**: `navigator.brave?.isBrave` or standard Chromium
     - **Google Chrome**: Default for all WebKit/Blink browsers.
2. **Primary Download Action**:
   - Sets button text dynamically: e.g. `Download for Chrome (v1.0.0)` or `Download for Firefox (v1.0.0)`.
   - Clicking immediately triggers the download of the relevant ZIP artifact from `assets/downloads/`.
   - Automatically surfaces the **Interactive Installation Guide Modal** to assist the user.
3. **Platform Dropdown Selector**:
   - Allows explicit manual choice:
     - `Google Chrome / Chromium (.zip)` (32 KB)
     - `Microsoft Edge (.zip)` (32 KB)
     - `Brave Browser (.zip)` (32 KB)
     - `Mozilla Firefox (.zip)` (32 KB)
     - `Source Code (GitHub Repository)`
4. **Verification Hash Display**:
   - Displays version `v1.0.0` and package checksum indicator for security transparency.

---

## 6. Interactive Installation Modal

### Tabbed Step-by-Step Instructions
- **Tab 1: Chromium (Chrome, Edge, Brave)**:
  1. Extract `velocityx-chrome-v1.0.0.zip` on your computer.
  2. In your browser address bar, visit `chrome://extensions` (or `edge://extensions`) and enable **Developer mode** toggle in the top-right corner.
  3. Click **Load unpacked** and select the unzipped folder containing `manifest.json`.
- **Tab 2: Mozilla Firefox**:
  1. Extract `velocityx-firefox-v1.0.0.zip`.
  2. In Firefox address bar, navigate to `about:debugging#/runtime/this-firefox`.
  3. Click **Load Temporary Add-on...** and select `manifest.json`.
- **UX Features**:
  - One-click copy buttons for browser URLs (`chrome://extensions`, `about:debugging#/runtime/this-firefox`).
  - Keyboard accessible (`Esc` closes modal, focus trapped inside dialog).

---

## 7. Telemetry Features, Keyboard Matrix & Security Sections

### Core Feature Cards
1. **Intelligent Rate Arbitration**: Neutralizes hostile site scripts and ads trying to reset playback speed; trips circuit breaker after >6 corrections in 1000ms.
2. **Fine-Grained 0.07× – 16.00× Control**: Infinitely adjustable speed stepping with customizable increments.
3. **Audio Gain Stage (Up to 300%)**: Native Web Audio GainNode amplifying quiet video tracks by +50%, +100%, +200% without distortion.
4. **Silence Skip (Audio RMS Analysis)**: Real-time decibel analysis skipping silent lecture pauses at 3.0×.
5. **Closed Shadow DOM Encapsulation**: Complete immunity against website CSS resets or hostile styling overrides.

### Hardware Shortcut Grid
- Visual matrix of 3D milled mechanical keys showcasing `[S]`, `[D]`, `[R]`, `[G]`, `[Z]`, `[X]`, `[V]`, `[K]`, `[P]`.

### Security & Privacy Audit
- Zero network requests, 100% offline execution.
- Minimal permissions: `["storage", "contextMenus"]`.
- Full MIT License and link to open-source repository at `https://github.com/Xenonesis/VelocityX`.

---

## 8. Verification & Acceptance Criteria

1. **Functional Download**:
   - Clicking the download button initiates the download of `velocityx-chrome-v1.0.0.zip` or `velocityx-firefox-v1.0.0.zip`.
   - The dropdown opens and allows choosing any target platform.
2. **Interactive Simulator**:
   - Sample video plays and loops smoothly in the hero.
   - Clicking HUD buttons (`<<`, `-`, `+`, `>>`, `x`) immediately changes playback speed and updates the readout.
   - Pressing shortcuts (`S`, `D`, `R`, `K`, `P`) correctly alters speed and triggers the OSD HUD toast.
3. **Installation Modal**:
   - Opens on download click or manual "Install Guide" button.
   - Switches between Chrome and Firefox tabs seamlessly.
   - URL copy buttons copy target address with visual confirmation.
4. **Responsiveness & Cross-Browser**:
   - Tested on desktop, tablet, and mobile screen sizes.
   - Zero horizontal scrollbars or overflow bugs.
   - Works cleanly in Chromium and Firefox.
