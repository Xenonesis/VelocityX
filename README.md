# VelocityX - Universal Video Speed Controller

> High-precision, fine-grained HTML5 media playback controller for Chromium browsers under **Manifest V3**.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-success?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-55%20passed-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Highlights

- ⚡ **Precision Speed Control**: Adjust playback speed from **0.07x up to 16.00x** with custom steps (default: `0.10x`).
- 🎯 **Minimalist On-Screen Overlay**: Clean, non-intrusive floating indicator (e.g. `2.20`) sitting directly on top of the video with closed Shadow DOM isolation.
- 🛡️ **Intelligent Speed Arbiter**: Automatically detects and restores your desired playback speed when aggressive player engines (YouTube, Netflix, Coursera) try to silently reset it back to 1.0x.
- 🤝 **Intent Classifier**: Automatically recognizes when you deliberately select a speed in a player's native menu and adopts your choice instead of fighting you.
- ⌨️ **Keyboard Input Safety**: Never interferes when typing inside search inputs, comment boxes, or contenteditable fields.
- 🔄 **SPA & Dynamic Player Ready**: Event-driven subtree tracking detects video elements on client-side navigation (YouTube SPA, TikTok, reels, modals) with zero polling loops.
- 🌐 **Per-Site Rules & Cloud Sync**: Set custom default speeds for specific domains (e.g. `*.coursera.org -> 2.00x`) synchronized via `chrome.storage.sync`.

---

## Default Keyboard Shortcuts

| Key | Action | Default Behavior |
|:---:|:---|:---|
| **`S`** | Decrease Speed | Slow down by `0.10x` |
| **`D`** | Increase Speed | Speed up by `0.10x` |
| **`R`** | Reset Speed | Reset playback to `1.00x` |
| **`Z`** | Rewind | Jump back by 10 seconds |
| **`X`** | Advance | Jump forward by 10 seconds |
| **`G`** | Preferred Speed | Toggle between current and preferred rate (default: `1.80x`) |
| **`V`** | Toggle Overlay | Show / hide on-screen speed badge |
| **`M`** | Set Marker | Bookmark current timestamp in playback |
| **`J`** | Jump to Marker | Seek directly to bookmarked marker |

*All shortcuts can be fully customized or disabled in the Extension Options page.*

---

## System Architecture

```
+------------------------------------------------------------------+
| Chrome Extension Environment |
| * chrome.storage.sync (Preferences, Shortcuts, Site Rules) |
| * Popup UI (Live gauge, quick presets, site toggles) |
| * Options UI (Tabbed settings, shortcuts, site rules builder) |
+--------------------------------+---------------------------------+
|
▼
+------------------------------------------------------------------+
| ISOLATED World (isolated-bridge.js) |
| * Bridges chrome.storage with MAIN world via CustomEvents |
| * Sanitizes payloads & validates schemas via migrateSettings |
+--------------------------------+---------------------------------+
| CustomEvent Bus
▼
+------------------------------------------------------------------+
| MAIN World Runtime (main-entry.js) |
| +-- MediaObserver: Subtree MutationObserver filtering |
| +-- MediaRegistry: WeakMap<HTMLMediaElement, MediaController> |
| +-- SelectionManager: Active media scoring (playing/area/time) |
| +-- SpeedArbiter: Loop-breaker rate arbitration |
| +-- IntentClassifier: Capturing trusted user gesture tracking |
| +-- ActionHandler: Typed command dispatcher |
| +-- ShortcutManager: Key matching & input safety protection |
| +-- SiteRuleEngine: Domain matching & priority resolution |
| +-- YouTubeHandler & NetflixHandler: Dedicated compatibility |
| +-- <velocity-controller>: Custom Element (closed Shadow DOM) |
+------------------------------------------------------------------+
```

---

## Installation & Development

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 2. Setup & Build
```bash
# Clone the repository
git clone https://github.com/Xenonesis/VelocityX.git
cd VelocityX

# Install dependencies
npm install

# Build the extension for Chrome
npm run build
```

### 3. Load Extension in Chrome
1. Open Google Chrome or any Chromium-based browser (Brave, Edge, Opera).
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `dist/` directory inside this repository.

---

## Quality & Testing

VelocityX includes comprehensive unit and integration tests covering rate arbitration, math normalization, DOM mutation filtering, input safety, and site compatibility.

```bash
# Run all 55 unit and component tests
npm run test

# Run TypeScript typechecking
npm run typecheck
```

---

## Security & Permissions

VelocityX strictly adheres to the principle of least privilege:
- **`permissions: ["storage"]`** — Used exclusively for synchronizing user preferences and custom site rules.
- **Zero remote scripts or eval**: 100% offline and statically bundled.
- **Zero telemetry / data tracking**: No user data ever leaves the local browser.

---

## License

MIT © [Xenonesis](https://github.com/Xenonesis)
