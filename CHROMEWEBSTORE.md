# Chrome Web Store Listing & Submission Guide: Velocity

> **Single Source of Truth** for Chrome Web Store Developer Dashboard metadata, permissions justifications, privacy disclosures, and store compliance.

---

## 1. Store Metadata

| Field | Value |
|---|---|
| **Extension Name** | Velocity — Video Speed Controller |
| **Version** | 1.0.0 |
| **Category** | Productivity / Accessibility |
| **Primary Language** | English |
| **Short Description** (≤ 132 chars) | Speed up, slow down, and fine-tune video and audio playback across any website with custom shortcuts and smart controls. |

---

## 2. Store Listing Description

```text
Take complete control of your video and audio playback across the web with Velocity. 

Whether you are skimming long lectures, reviewing technical tutorials, binge-watching content, or slowing down dialogue to learn a language, Velocity provides smooth, fine-grained playback speed adjustment from 0.07x up to 16x.

Key Features:
• Precise Speed Tuning: Adjust speed in fine increments (default ±0.1x) or set custom steps to fit your viewing pace.
• Universal Media Control: Works on HTML5 video and audio across major video platforms, streaming services, and online learning portals.
• Intuitive Keyboard Shortcuts: Speed up, slow down, reset to 1x, toggle your preferred speed, rewind, and advance with single-key shortcuts.
• Non-Intrusive On-Screen Controller: A compact, draggable pill overlay gives you quick access directly above the video without blocking subtitles or player menus.
• Smart Site Compatibility: Intelligently preserves site-native speed settings when you choose to use the player's own menu, while protecting against unexpected player speed resets.
• Per-Site Defaults: Automatically start videos at your preferred speed for educational sites (e.g. 2.0x for Coursera) while keeping normal speed elsewhere.
• Video Markers: Press M to drop a timestamp marker and J to jump right back instantly.
• Clean, Fast, and Lightweight: Built for immediate responsiveness with zero bloat or background lag.

Default Shortcuts:
• S — Decrease speed
• D — Increase speed
• R — Reset speed to 1.0x
• Z — Rewind 10 seconds
• X — Advance 10 seconds
• G — Preferred speed toggle
• V — Show/hide on-screen controller
• M — Set marker
• J — Jump to marker

Typing Protection:
Velocity automatically detects when you are typing in comments, search bars, text boxes, or forms so your shortcuts never interfere with normal typing.

Privacy by Design:
Velocity runs 100% offline directly in your browser. It does not collect, analyze, or transmit your browsing history, video titles, or user activity. No accounts, no ads, and no external tracking.
```

---

## 3. Permissions Justification

The Chrome Web Store review team requires specific, non-generic justifications for every requested permission.

### Declared Permissions

| Permission | Justification |
|---|---|
| `storage` | Velocity uses the `storage` API exclusively to save and sync user preferences—including keyboard shortcut bindings, default speeds, preferred step sizes, and custom per-site rules—across the user's browser sessions. No browsing history or personal data is ever stored. |

### Content Script URL Match Justification

| Match Pattern | Justification |
|---|---|
| `http://*/*`<br>`https://*/*`<br>`file:///*` | Velocity requires broad webpage matching solely to discover standard HTML5 `<video>` and `<audio>` elements across the websites and local files that users choose to visit, in order to mount the playback controller and apply user-selected playback rates. Velocity does not read page text, user account details, or credentials. |

---

## 4. Privacy & Data Use Disclosures

For the Chrome Developer Dashboard **Privacy** tab:

1. **Single Purpose Description**:  
   Velocity provides fine-grained playback speed, seeking, and shortcut controls for HTML5 video and audio elements on web pages.

2. **Data Collection Disclosures**:
   - Personally identifiable information: **No**
   - Health information: **No**
   - Financial and payment information: **No**
   - Authentication information: **No**
   - Personal communications: **No**
   - Location: **No**
   - Web history: **No**
   - User activity: **No**
   - Website content: **No**

3. **Data Usage Certifications**:
   - [x] Does not sell user data to third parties.
   - [x] Does not use or transfer user data for purposes unrelated to the extension's core functionality.
   - [x] Does not use or transfer user data for creditworthiness or lending purposes.

---

## 5. Visual Asset Requirements

Before submitting to the Chrome Developer Dashboard, prepare the following image assets:

1. **Extension Icons** (Included in `dist/assets/icons/`):
   - `icon-16.png` (16×16 px)
   - `icon-48.png` (48×48 px)
   - `icon-128.png` (128×128 px)
2. **Promotional Marquee / Store Tile**:
   - Small promo tile: 440×280 px
   - Marquee banner: 1400×560 px
3. **Store Screenshots** (At least 1 required, 1280×800 px or 640×400 px):
   - Screenshot 1: In-video pill controller on a video player with speed badge.
   - Screenshot 2: Velocity extension popup with live speed gauge and quick presets.
   - Screenshot 3: Full settings page showing custom keyboard shortcuts table and per-site rules.

---

## 6. Packaging & Release Verification Checklist

- [x] Manifest version is V3 (`"manifest_version": 3`).
- [x] Minimal permissions declared (`"storage"` only).
- [x] Zero external code injection (`eval`, `new Function`, or remote scripts).
- [x] All icon files referenced in `manifest.json` exist as valid PNG files with exact pixel dimensions.
- [x] Content scripts run in both `ISOLATED` and `MAIN` worlds without global variable pollution.
- [x] Unit test suite passes 100% (55/55 tests across all components).
- [x] Build produces a clean, self-contained `dist/` directory loadable via Chrome "Load unpacked".
- [x] Packaging command:
  ```bash
  npm run build
  # To produce store ZIP:
  cd dist && zip -r ../velocity-v1.0.0.zip .
  ```
