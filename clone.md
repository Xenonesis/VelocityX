# Video Speed Controller Clone — Production Build Plan

> **Document:** `clone.md`  
> **Target:** Chromium browser extension (Chrome / Edge / Brave / Opera)  
> **Manifest:** MV3  
> **Goal:** Build a production-quality Video Speed Controller clone with feature parity first, then carefully add improvements without making the extension bloated or unreliable.

---

## 1. Executive Summary

We are building a browser extension that gives users fine-grained control over any HTML5 `<video>` or `<audio>` element.

The extension must:

- work on normal webpages, SPAs, dynamically-loaded players and iframes;
- expose an unobtrusive controller directly on top of media;
- support keyboard shortcuts;
- change playback speed reliably even when a website tries to reset it;
- preserve site-native playback controls when the user intentionally changes speed there;
- support per-site settings;
- remember speed when configured;
- support seeking, preferred speed, markers and controller visibility;
- have a lightweight popup and a complete settings page;
- use minimal permissions and collect no browsing data;
- remain performant on pages containing many videos/iframes.

This should **not** be implemented as a single content script that simply does:

```js
video.playbackRate = 2;
```

A modern implementation needs media discovery, state management, action routing, user-intent classification, rate arbitration, site compatibility handlers, Shadow DOM UI, persistence and extension-page/content-page communication.

---

# 2. Research Baseline

The reference extension currently exposes the following important capabilities:

- HTML5 video **and audio** control.
- Speed range approximately **0.07x–16x**.
- Configurable speed increments.
- Speed increase/decrease/reset.
- Rewind and advance controls.
- Preferred-speed toggle.
- Show/hide overlay.
- Video position marker and jump-back.
- Per-site default speeds.
- Per-site disable rules.
- Remember playback speed across sessions/tabs.
- Protection against sites automatically resetting playback rate.
- Draggable controller.
- Fully customizable shortcuts with modifiers.
- Custom controller CSS.
- Dynamic media support.
- Support across nested frames.
- Site-specific compatibility handling.

Default reference shortcuts:

| Action | Default key |
|---|---|
| Decrease speed | `S` |
| Increase speed | `D` |
| Reset speed | `R` |
| Rewind 10 sec | `Z` |
| Advance 10 sec | `X` |
| Preferred speed toggle | `G` |
| Show/hide controller | `V` |
| Set marker | `M` |
| Jump to marker | `J` |

Reference implementation is currently a Manifest V3 extension and uses only the `storage` extension permission in its public manifest. Its content execution covers HTTP, HTTPS and `file://` pages, runs in all frames, and uses both isolated-world and main-world scripts.

---

# 3. Clone Strategy

There are two valid approaches.

## Option A — Clean-Room Reimplementation — Recommended

Rebuild the product behavior from documented functionality and observed UX, with our own architecture and UI.

Advantages:

- easier long-term maintenance;
- no inherited legacy decisions;
- easier TypeScript migration;
- unique branding/UI;
- cleaner Chrome Web Store submission;
- easier future feature development.

## Option B — Direct MIT Fork

Fork the original open-source repository and modify it.

Advantages:

- fastest path to parity;
- battle-tested browser compatibility;
- existing tests and site handlers.

Requirements:

- retain the original MIT copyright/license notice;
- do not imply that the new product is the original developer's official extension;
- use a distinct extension name, icon, screenshots and branding;
- review every upstream dependency and permission before publishing.

### Recommended Choice

Use the reference project as **behavioral research**, but implement a cleaner TypeScript architecture inspired by its proven patterns.

---

# 4. Product Name

Use a new brand instead of publishing as exactly **Video Speed Controller**.

Working name examples:

- Velocity
- Video Velocity
- Pace
- Media Pace
- SpeedFlow
- Playback Pro

Internal codename used in this plan:

`Velocity`

---

# 5. Primary Product Principles

## 5.1 Universal

Any normal HTML5 `<video>` or `<audio>` element should be controllable.

## 5.2 Instant

Keyboard interaction must feel immediate.

Target action response:

`< 16 ms` after the event reaches our content runtime whenever possible.

## 5.3 Non-invasive

Do not break:

- site scrolling;
- native keyboard controls;
- fullscreen;
- picture-in-picture;
- captions;
- DRM playback;
- accessibility controls;
- normal player clicks.

## 5.4 Lightweight

No React/Vue runtime is needed inside every webpage.

Use native DOM + Shadow DOM for the overlay.

## 5.5 Privacy-first

No analytics by default.

No browsing history collection.

No remote code.

No unnecessary host/API permissions.

## 5.6 Deterministic

A speed value should never unexpectedly oscillate because the page and extension are fighting each other.

---

# 6. Target Browser Support

### Phase 1

- Google Chrome
- Microsoft Edge
- Brave
- Opera
- Chromium browsers supporting Manifest V3

### Phase 2

- Firefox via WebExtensions compatibility layer

### Phase 3

- Safari Web Extension port

Do not block Chromium launch waiting for Firefox/Safari parity.

---

# 7. Recommended Technology Stack

## Extension Runtime

- TypeScript
- Manifest V3
- standard WebExtension/Chrome APIs

## Build

- Node.js LTS
- esbuild

## UI

### In-page overlay
- native Custom Elements
- Shadow DOM
- CSS

### Popup/settings
- vanilla TypeScript + HTML/CSS

React is unnecessary unless the options UI later becomes substantially more complex.

## State validation

- lightweight manual schemas or Zod if desired

Avoid putting a heavy runtime in every webpage merely for settings validation.

## Tests

- Vitest — units
- jsdom — DOM behavior
- Playwright or Puppeteer — real browser extension integration tests

## Code Quality

- ESLint
- Prettier

---

# 8. Recommended Repository Structure

```text
velocity/
├── manifest.json
├── package.json
├── tsconfig.json
├── eslint.config.js
├── vitest.config.ts
├── README.md
├── LICENSE
│
├── src/
│   ├── background/
│   │   └── service-worker.ts
│   │
│   ├── entries/
│   │   ├── isolated-bridge.ts
│   │   └── main-entry.ts
│   │
│   ├── core/
│   │   ├── media-controller.ts
│   │   ├── media-registry.ts
│   │   ├── action-handler.ts
│   │   ├── speed-arbiter.ts
│   │   ├── intent-classifier.ts
│   │   ├── state-manager.ts
│   │   ├── settings-manager.ts
│   │   ├── shortcut-manager.ts
│   │   ├── site-rule-engine.ts
│   │   ├── selection-manager.ts
│   │   └── constants.ts
│   │
│   ├── observers/
│   │   ├── media-observer.ts
│   │   ├── dom-observer.ts
│   │   └── fullscreen-observer.ts
│   │
│   ├── ui/
│   │   ├── overlay/
│   │   │   ├── velocity-controller.ts
│   │   │   ├── controls.ts
│   │   │   ├── drag-handler.ts
│   │   │   ├── shadow-root.ts
│   │   │   └── overlay.css
│   │   ├── popup/
│   │   │   ├── popup.html
│   │   │   ├── popup.ts
│   │   │   └── popup.css
│   │   └── options/
│   │       ├── options.html
│   │       ├── options.ts
│   │       └── options.css
│   │
│   ├── sites/
│   │   ├── base-handler.ts
│   │   ├── registry.ts
│   │   ├── youtube.ts
│   │   ├── netflix.ts
│   │   ├── amazon.ts
│   │   ├── apple.ts
│   │   ├── facebook.ts
│   │   └── dailymotion.ts
│   │
│   ├── storage/
│   │   ├── schema.ts
│   │   ├── defaults.ts
│   │   ├── migrations.ts
│   │   └── storage.ts
│   │
│   ├── utils/
│   │   ├── domain.ts
│   │   ├── clamp.ts
│   │   ├── keyboard.ts
│   │   ├── media.ts
│   │   └── debounce.ts
│   │
│   └── assets/
│       └── icons/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── browser/
│   └── fixtures/
│
└── scripts/
    ├── build.ts
    ├── package.ts
    └── verify-manifest.ts
```

---

# 9. Manifest V3 Design

Minimal initial manifest:

```json
{
  "manifest_version": 3,
  "name": "Velocity",
  "version": "1.0.0",
  "description": "Fine-grained playback controls for HTML5 video and audio.",
  "permissions": ["storage"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "ui/popup/popup.html"
  },
  "options_ui": {
    "page": "ui/options/options.html",
    "open_in_tab": true
  },
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*", "file:///*"],
      "all_frames": true,
      "match_about_blank": true,
      "js": ["isolated-bridge.js"],
      "run_at": "document_start",
      "world": "ISOLATED"
    },
    {
      "matches": ["http://*/*", "https://*/*", "file:///*"],
      "all_frames": true,
      "match_about_blank": true,
      "js": ["main-entry.js"],
      "run_at": "document_idle",
      "world": "MAIN"
    }
  ]
}
```

### Why Two Execution Worlds?

Some extension APIs such as storage are available in the extension's isolated context, while direct interaction with page JavaScript behavior may require execution in the page's main world.

Therefore:

```text
Chrome extension APIs
        │
        ▼
Isolated bridge
        │ CustomEvent/message
        ▼
Main-world runtime
        │
        ▼
HTMLMediaElement + page/player
```

Keep this bridge extremely narrow.

Never expose arbitrary extension commands to untrusted page scripts.

---

# 10. Runtime Architecture

```text
                         ┌─────────────────────┐
                         │ chrome.storage      │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │ Isolated Bridge     │
                         └──────────┬──────────┘
                                    │
                            safe message bus
                                    │
┌───────────────────────────────────▼──────────────────────────────────┐
│ Main Page Runtime                                                   │
│                                                                      │
│  DOM Observer ───────► Media Registry ─────► Media Controller       │
│                              │                    │                  │
│                              │                    ▼                  │
│ Keyboard ─► Action Handler ──┼──────────► Speed Arbiter             │
│                              │                    │                  │
│ Site Handler ────────────────┘                    ▼                  │
│                                             HTMLMediaElement         │
│                                                                      │
│ Media Registry ─────────────► Overlay Controller                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 11. Media Discovery

Never scan the entire DOM repeatedly.

Use this approach:

1. Initial lightweight query:
   - `video`
   - `audio`

2. Attach a `MutationObserver`.

3. For each newly-added node:
   - test if node itself is media;
   - query media descendants only inside that new subtree.

4. Register each media element in a `WeakMap`.

5. De-register when disconnected.

Pseudo-flow:

```ts
function discover(root: ParentNode) {
  if (root instanceof HTMLMediaElement) register(root);

  root.querySelectorAll?.("video,audio").forEach(register);
}

const observer = new MutationObserver(records => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node instanceof Element) discover(node);
    }
  }
});
```

Use a `WeakMap<HTMLMediaElement, MediaController>` so detached elements can be garbage-collected.

---

# 12. Media Registry

The extension may encounter several media elements on one page.

Maintain:

```ts
interface RegisteredMedia {
  id: string;
  element: HTMLMediaElement;
  controller: MediaController;
  visible: boolean;
  area: number;
  lastInteractionAt: number;
  playing: boolean;
}
```

Need an **active-media selection policy**.

Priority:

1. most recently user-interacted media;
2. currently playing visible media;
3. largest visible media;
4. most recently playing media;
5. first valid registered media.

This prevents keyboard shortcuts accidentally controlling a tiny hidden background video.

---

# 13. Playback Speed Model

Use explicit constants:

```ts
const MIN_SPEED = 0.07;
const MAX_SPEED = 16;
const DEFAULT_STEP = 0.1;
const NORMAL_SPEED = 1;
```

Normalize floating point values:

```ts
function normalizeRate(rate: number): number {
  return Math.round(rate * 100) / 100;
}
```

Always:

```ts
rate = clamp(normalizeRate(rate), MIN_SPEED, MAX_SPEED);
```

---

# 14. Speed Arbiter — Critical Component

This is one of the most important parts of a reliable clone.

Problem:

A website/player may execute:

```js
video.playbackRate = 1;
```

after our extension selected `2x`.

A naive controller will lose.

But blindly setting it back to `2x` on every `ratechange` breaks intentional speed changes made through the website's own player.

Therefore we need an arbiter.

---

# 15. Speed Ownership Model

Each media controller tracks:

```ts
type RateSource =
  | "extension"
  | "site-user"
  | "site-automatic"
  | "initial"
  | "restored";
```

State:

```ts
interface SpeedState {
  desiredRate: number;
  observedRate: number;
  lastExtensionChangeAt: number;
  lastTrustedUserInteractionAt: number;
  siteChangeCandidateAt: number;
}
```

---

# 16. User Intent Classification

Observe meaningful user activity around the player:

- pointerdown
- click
- touchstart
- keyboard events
- native playback menu interactions where detectable
- relevant player control interaction

Then classify a nearby rate change.

Example logic:

```text
ratechange occurs
        │
        ├─ caused by our own setter? ─────────► extension
        │
        ├─ immediately follows trusted user interaction?
        │                                      └─► site-user
        │
        └─ otherwise ─────────────────────────► site-automatic
```

### Result

If `site-user`:

- accept new playback rate;
- update desired rate;
- optionally persist it.

If `site-automatic`:

- restore our desired rate.

This gives us **fightback without fighting the user**.

---

# 17. Rate Fightback

When automatic resets are detected:

```ts
if (
  classification === "site-automatic" &&
  media.playbackRate !== state.desiredRate
) {
  media.playbackRate = state.desiredRate;
}
```

Add loop protection:

```ts
const MAX_CORRECTIONS_PER_WINDOW = 6;
```

If a website aggressively alternates the value:

- stop rapid corrections temporarily;
- log debug information locally;
- invoke site-specific compatibility strategy.

Never create an infinite `ratechange` loop.

---

# 18. Main Actions

Define commands, not UI-specific handlers.

```ts
type MediaAction =
  | { type: "speed.increase" }
  | { type: "speed.decrease" }
  | { type: "speed.set"; value: number }
  | { type: "speed.reset" }
  | { type: "speed.preferred.toggle" }
  | { type: "seek.relative"; seconds: number }
  | { type: "overlay.toggle" }
  | { type: "marker.set" }
  | { type: "marker.jump" };
```

Everything—keyboard, overlay and popup—dispatches the same action types.

---

# 19. Speed Increase / Decrease

```ts
newRate = currentRate + speedStep;
```

or:

```ts
newRate = currentRate - speedStep;
```

Default:

`0.1`

Settings should support at least:

- `0.05`
- `0.1`
- `0.25`
- `0.5`
- custom numeric step

---

# 20. Reset Behavior

Default reset:

```text
current → 1.0x
```

Optional advanced setting:

`resetSpeed`

Default remains `1.0`.

---

# 21. Preferred Speed

Store:

```ts
preferredSpeed: 1.8
```

When user presses preferred-speed shortcut:

```text
current != preferred → preferred
current == preferred → previous speed
```

Track:

```ts
previousRateBeforePreferred
```

Do not always toggle to `1x`; restore the prior value.

---

# 22. Seeking

Commands:

```text
rewind = -10 sec
advance = +10 sec
```

Configurable values.

Safe implementation:

```ts
const target = clamp(
  media.currentTime + seconds,
  0,
  Number.isFinite(media.duration) ? media.duration : Infinity
);

media.currentTime = target;
```

For streams/live media, detect non-seekable cases and silently no-op or give subtle UI feedback.

---

# 23. Markers

Per media session:

```ts
markerTime?: number;
```

`M`:

```text
markerTime = currentTime
```

`J`:

```text
currentTime = markerTime
```

Optional v2:

- multiple named markers;
- persist markers per URL.

Do not include persistent marker complexity in v1.

---

# 24. Controller Overlay

Each eligible media element receives a lightweight overlay.

Default collapsed state:

```text
┌────────┐
│ 1.50×  │
└────────┘
```

Hovered/expanded:

```text
┌──────────────────────────┐
│  ‹‹   −   1.50×   +   ›› │
└──────────────────────────┘
```

Recommended buttons:

- rewind
- slower
- rate display
- faster
- forward

Optional:

- reset
- settings

---

# 25. Overlay Implementation

Use a Custom Element:

```html
<velocity-controller></velocity-controller>
```

Internally use:

```ts
this.attachShadow({ mode: "closed" });
```

Why Shadow DOM:

- host-page CSS should not destroy our controls;
- our CSS should not leak into the webpage;
- more predictable rendering across sites.

---

# 26. Overlay Positioning

Preferred architecture:

- wrapper positioned relative to the visual media container;
- controller positioned absolutely.

Need to handle:

- video moving/resizing;
- fullscreen;
- responsive players;
- CSS transforms;
- detached/replaced player nodes.

Possible tools:

- `ResizeObserver`
- `IntersectionObserver`
- targeted layout updates

Avoid a permanent high-frequency `requestAnimationFrame()` loop for every video.

---

# 27. Dragging

Controller can be dragged.

Store normalized position instead of raw pixels:

```ts
{
  xRatio: 0.04,
  yRatio: 0.04
}
```

This survives video resizing better.

Clamp to player bounds.

Support:

- mouse;
- touch;
- pointer events.

Use Pointer Events for one unified implementation.

---

# 28. Overlay Visibility State Machine

States:

```text
hidden
collapsed
expanded
dragging
```

Transitions:

```text
collapsed --hover--> expanded
expanded --leave--> collapsed
any --toggle--> hidden
hidden --toggle--> collapsed
expanded --drag--> dragging
dragging --pointerup--> expanded
```

Do not let timers hide the overlay while dragging.

---

# 29. Keyboard Shortcut Engine

Store bindings as data:

```ts
interface ShortcutBinding {
  id: string;
  action: MediaActionTemplate;
  code?: string;
  key?: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  enabled: boolean;
}
```

Use `KeyboardEvent.code` where layout-independent physical-key behavior is preferred.

Allow modifiers:

- Ctrl
- Alt
- Shift
- Meta

---

# 30. Default Shortcuts

Recommended parity defaults:

```text
S → speed down
D → speed up
R → reset
Z → rewind 10 seconds
X → advance 10 seconds
G → preferred speed
V → controller visibility
M → marker
J → jump to marker
```

---

# 31. Input Field Safety

Keyboard actions must not trigger while users are typing.

Ignore shortcuts when event target is:

- `<input>`
- `<textarea>`
- `<select>`
- contenteditable
- textbox-like ARIA control

unless an explicit advanced setting allows site-key override.

---

# 32. Event Propagation

Provide configurable behavior.

Modes:

### Extension-only

Handle matched shortcut and stop propagation.

### Cooperative

Run extension action while allowing page listeners to receive the event.

### Site-first

Do not claim conflicting shortcuts under specified conditions.

Default should favor compatibility rather than aggressively swallowing every event.

---

# 33. Per-Site Rules

Rule model:

```ts
interface SiteRule {
  id: string;
  match: string;
  enabled: boolean;
  defaultSpeed?: number;
  preferredSpeed?: number;
  rememberSpeed?: boolean;
  overlayEnabled?: boolean;
}
```

Examples:

```text
youtube.com        → default 1.5x
coursera.org       → default 2.0x
netflix.com        → remember speed
example.com        → controller disabled
```

---

# 34. Domain Matching

Support:

- exact host
- subdomain wildcard
- optional URL glob later

Examples:

```text
youtube.com
*.coursera.org
```

Normalize hostnames:

- lowercase;
- strip leading `www.` only for display, not blindly for rule semantics.

---

# 35. Setting Priority

Use deterministic priority:

```text
hard safety constraints
        >
per-site rule
        >
session state
        >
remembered global speed
        >
global default speed
```

For each new media element:

```text
1. check disabled site
2. read matching site rule
3. determine initial speed
4. initialize controller
5. apply speed
6. mount overlay
```

---

# 36. Remember Playback Speed

Settings:

```ts
rememberPlaybackSpeed: boolean
```

If enabled:

```text
user sets 1.8x
→ storage.lastSpeed = 1.8
→ new supported media starts at 1.8x
```

Debounce writes.

Do not write to `chrome.storage` on every tiny rate event.

---

# 37. Storage Schema

```ts
interface SettingsV1 {
  schemaVersion: 1;

  enabled: boolean;

  defaultSpeed: number;
  preferredSpeed: number;
  speedStep: number;

  rewindSeconds: number;
  advanceSeconds: number;

  rememberPlaybackSpeed: boolean;
  lastSpeed: number;

  overlay: {
    enabled: boolean;
    position: {
      xRatio: number;
      yRatio: number;
    };
    opacity: number;
    customCss: string;
  };

  shortcuts: ShortcutBinding[];

  siteRules: SiteRule[];

  compatibility: {
    fightAutomaticRateReset: boolean;
  };
}
```

---

# 38. Storage Migrations

Never assume persisted settings stay current forever.

```ts
switch (settings.schemaVersion) {
  case 1:
    return migrateV1toV2(settings);
}
```

Rules:

- migration must be deterministic;
- preserve unknown valid user preferences where possible;
- never destroy settings on parse failure;
- have defaults as fallback.

---

# 39. Storage API

Use:

`chrome.storage.sync`

for modest user preferences if storage size permits.

Potentially use:

`chrome.storage.local`

for:

- local debug state;
- larger per-site data;
- non-sync statistics.

Do not sync noisy analytics.

---

# 40. Popup UI

The popup should be useful but minimal.

Suggested layout:

```text
Velocity
────────────────────
Current media: 1
Speed      [-] 1.50x [+]

[ 1x ] [ 1.5x ] [ 2x ] [ 3x ]

Remember speed       ON
Controller on site   ON

Open settings
```

Popup should detect if no controllable media exists:

```text
No HTML5 video/audio detected on this page.
```

---

# 41. Options UI

Sections:

## General

- Extension enabled
- Default speed
- Speed step
- Preferred speed
- Remember last speed
- Rewind seconds
- Forward seconds

## Keyboard Shortcuts

Editable table:

```text
Action              Shortcut
Speed up             D
Speed down           S
Reset                R
Rewind               Z
Forward              X
Preferred speed      G
Toggle controller    V
Set marker           M
Jump marker          J
```

Support:

- edit;
- remove;
- add custom binding;
- duplicate conflict warning.

## Controller

- enable overlay;
- opacity;
- controller position;
- reset position;
- custom CSS.

## Site Rules

Table:

```text
Website         Enabled     Default speed
youtube.com       yes           1.5
coursera.org      yes           2.0
example.com       no             -
```

## Advanced

- fight automatic speed resets;
- shortcut event propagation behavior;
- reset all settings.

---

# 42. Background Service Worker

Keep background logic small.

Responsibilities:

- installation/default initialization;
- version migrations if necessary;
- popup-to-tab messaging;
- optional context-menu support later;
- extension-level coordination.

Do not move high-frequency media logic through the service worker.

Media interaction belongs in the page runtime.

---

# 43. Isolated Bridge

Responsibilities:

- access `chrome.storage`;
- observe storage changes;
- pass sanitized setting payloads to main world;
- accept restricted persistence requests from main world.

Possible event names:

```text
velocity:settings:init
velocity:settings:update
velocity:storage:set-last-speed
```

Validate all payloads.

---

# 44. Main World Runtime

Responsibilities:

- discover media;
- manage media controllers;
- keyboard events;
- UI overlay;
- playback rate arbitration;
- site handlers;
- local ephemeral state.

It should not directly depend on Chrome extension APIs.

This separation improves testability.

---

# 45. Site-Specific Compatibility Layer

Base interface:

```ts
interface SiteHandler {
  matches(location: Location): boolean;

  onMediaAdded?(
    media: HTMLMediaElement,
    ctx: SiteContext
  ): void;

  classifyRateChange?(
    event: Event,
    ctx: RateChangeContext
  ): RateSource | undefined;

  getMediaContainer?(
    media: HTMLMediaElement
  ): HTMLElement | null;

  cleanup?(): void;
}
```

Always have a `BaseSiteHandler`.

Specific handlers should be exceptions, not the default path.

---

# 46. Initial Site Compatibility Targets

Test explicitly on:

- YouTube
- Netflix
- Amazon Prime Video
- Coursera
- Udemy
- Vimeo
- Dailymotion
- Facebook
- Instagram
- X/Twitter
- Twitch VOD
- Google Drive video
- Dropbox video
- local `file://` videos

Not every site needs a custom handler.

Add one only when generic behavior fails.

---

# 47. YouTube

Potential issues:

- SPA navigation;
- player element replacement;
- native speed controls;
- click-and-hold playback interactions;
- Shorts;
- embedded players;
- keyboard shortcut conflicts.

Required tests:

```text
normal video
short
playlist navigation
theater mode
fullscreen
native speed menu
embedded video
```

---

# 48. Netflix / DRM Services

Never attempt to bypass DRM.

Changing HTMLMediaElement playback properties is separate from circumventing content protection.

Compatibility tests:

- playbackRate;
- seeking;
- overlay positioning;
- fullscreen;
- native speed changes.

If a service rejects certain rates, gracefully constrain behavior rather than hacking around DRM.

---

# 49. Iframes

Manifest must run in all frames.

Each frame gets its own media registry.

Keyboard behavior needs care.

Preferred policy:

- only frame currently receiving keyboard event acts;
- top frame may coordinate popup commands;
- avoid multiple frames responding to the same global request.

Frame identity can be handled via browser runtime messages if needed.

---

# 50. Shadow DOM / Component Isolation

Host page can contain CSS like:

```css
button {
  all: unset;
}
```

or:

```css
div {
  display: none;
}
```

Our controls must remain intact.

Shadow DOM is therefore non-negotiable for a polished universal overlay.

---

# 51. Accessibility

Overlay controls must have:

- semantic buttons;
- `aria-label`;
- visible keyboard focus;
- sufficient contrast;
- minimum target size;
- no keyboard traps.

Examples:

```html
<button aria-label="Decrease playback speed">−</button>
```

Speed announcements may use an optional polite live region:

```html
<div aria-live="polite">Playback speed 1.5x</div>
```

Avoid announcing every tiny automatic correction.

---

# 52. Performance Budget

Targets:

### Idle page

Near-zero CPU usage when no media or interaction occurs.

### Mutation handling

Do not rescan `document` after every mutation.

### Memory

Per media controller should remain small.

### Storage

Debounce writes by ~250–500 ms.

### Observers

Disconnect observers when no longer needed.

### DOM

Only mount UI for valid media.

Optionally skip tiny videos by default.

---

# 53. Tiny / Hidden Media Filter

Pages often contain:

- tracking videos;
- hidden ads;
- zero-sized media;
- preloaded players.

Possible UI threshold:

```ts
const MIN_OVERLAY_WIDTH = 160;
const MIN_OVERLAY_HEIGHT = 90;
```

The media may still be controllable via shortcuts even if overlay is not mounted.

Make this policy configurable internally.

---

# 54. Fullscreen

Need to handle:

```text
document.fullscreenchange
webkitfullscreenchange (fallback if necessary)
```

Re-evaluate controller container and z-index.

Never force fullscreen exit.

---

# 55. Picture-in-Picture

Playback speed should continue working.

The webpage overlay obviously will not render inside the operating system's PiP window.

Popup/shortcuts can still control the original media where browser behavior permits.

Do not promise overlay controls inside native PiP.

---

# 56. Custom CSS

Advanced users can style controller CSS.

Security requirements:

- CSS only;
- no HTML injection;
- no JavaScript evaluation;
- never use `eval`;
- never fetch remote CSS.

Option:

```text
Custom controller CSS
```

Provide a “Reset CSS” button.

---

# 57. Privacy

Recommended product promise:

> Velocity does not collect, sell, transmit or analyze browsing history, video titles, viewed URLs or playback activity.

Default implementation:

- no telemetry;
- no remote analytics;
- no user account;
- no external API;
- all settings local/sync storage only.

If analytics is ever added later, it must be explicitly designed and disclosed first.

---

# 58. Security

## Never

- use `eval`;
- inject remote JavaScript;
- execute user-entered JavaScript;
- use broad messaging without origin/type validation;
- store arbitrary page content;
- collect URLs unnecessarily;
- expose privileged browser APIs directly into MAIN world.

## Validate

- speed numeric bounds;
- shortcut definitions;
- site-rule patterns;
- storage payloads;
- custom CSS length.

---

# 59. Content Security Policy

Keep extension pages compatible with Manifest V3 CSP.

No inline scripts.

Use separate bundled JS files.

---

# 60. UX Details

When speed changes:

```text
1.50×
```

temporarily emphasize the display.

Do not show a toast on every keypress if the overlay already communicates the change.

On repeated keypress:

```text
1.5x
1.6x
1.7x
1.8x
```

UI should update immediately.

---

# 61. Decimal Precision

Avoid:

```text
1.5000000000000002
```

Display max 2 decimals:

```text
1.5×
1.25×
0.75×
```

Implementation:

```ts
function formatRate(rate: number): string {
  return Number(rate.toFixed(2)).toString() + "×";
}
```

---

# 62. Audio Support

Do not design only around videos.

`HTMLAudioElement` inherits from `HTMLMediaElement`.

Keyboard speed/seek actions should work.

Overlay approach:

- if a visible native audio player exists, attach compact controller nearby;
- otherwise keyboard/popup controls remain available.

---

# 63. Error Handling

Individual media failures must not crash the entire extension.

Pattern:

```ts
try {
  controller.applyRate(rate);
} catch (error) {
  debug.warn("rate apply failed", error);
}
```

Debug logging disabled in production unless local debug mode is enabled.

---

# 64. Testing Strategy

## Unit Tests

Test:

- clamp/normalization;
- rate formatting;
- action reducer;
- settings merging;
- site-rule matching;
- shortcut matching;
- intent classifier;
- rate arbiter;
- active-media selection;
- storage migrations.

---

# 65. Rate Arbiter Test Matrix

Critical cases:

### A

```text
desired = 2x
site automatically sets 1x
expected = restore 2x
```

### B

```text
desired = 2x
user opens native player speed menu and selects 1.5x
expected = accept 1.5x
```

### C

```text
extension sets 1.8x
ratechange fires
expected = classify as extension
```

### D

```text
site oscillates speed repeatedly
expected = no infinite feedback loop
```

---

# 66. DOM Tests

Test:

- media exists on initial load;
- media inserted later;
- media removed;
- media replaced;
- nested media;
- multiple videos;
- audio;
- zero-size media.

---

# 67. Shortcut Tests

Test:

- default keys;
- modifier combinations;
- remapped key;
- duplicate keys;
- contenteditable;
- input field;
- site propagation;
- held key;
- IME/composition events.

---

# 68. Browser Integration Tests

Automated extension-enabled browser tests:

1. load fixture page;
2. play video;
3. press `D`;
4. assert `playbackRate`;
5. press `Z`;
6. assert changed `currentTime`;
7. dynamically append video;
8. confirm it becomes controllable;
9. simulate site rate reset;
10. verify arbiter behavior.

---

# 69. Fixture Pages

Create controlled local fixtures:

```text
simple-video.html
multiple-videos.html
audio.html
dynamic-video.html
iframe-video.html
shadow-host-page.html
aggressive-rate-reset.html
native-speed-control.html
fullscreen.html
```

This prevents depending on third-party websites for all automated testing.

---

# 70. Manual Compatibility Checklist

For each target site:

```text
[ ] extension loads
[ ] overlay appears
[ ] overlay does not obscure key native controls
[ ] speed up works
[ ] speed down works
[ ] reset works
[ ] seek works
[ ] preferred speed works
[ ] site native speed control still works
[ ] fullscreen works
[ ] SPA navigation works
[ ] multiple videos behave correctly
[ ] no console errors
[ ] no scrolling regression
```

---

# 71. Known Hard Problems

### Player fights speed changes

Solution:
speed arbitration + intent classifier.

### Dynamic SPA replacement

Solution:
MutationObserver + media registry.

### Host CSS destroys overlay

Solution:
Shadow DOM.

### Iframe video

Solution:
`all_frames: true`.

### Shortcut conflicts

Solution:
configurable propagation and input safety.

### Fullscreen positioning

Solution:
fullscreen observer + container re-resolution.

### Multiple active videos

Solution:
selection manager.

### Scroll/volume conflict

Solution:
do not swallow wheel or pointer events outside controller interaction.

---

# 72. Features to Avoid in V1

Do **not** initially add:

- AI summarization;
- cloud account;
- transcript generation;
- SponsorBlock clone;
- remote server;
- recommendation engine;
- media downloader;
- DRM bypass;
- ad blocking;
- user tracking.

These dramatically increase complexity and privacy/store review risk.

Core reliability matters more.

---

# 73. V1 Feature Definition — Exact Scope

V1 is complete only when it includes:

### Media

- [ ] Video support
- [ ] Audio support
- [ ] Dynamic media support
- [ ] iframe support

### Speed

- [ ] Increase
- [ ] Decrease
- [ ] Set exact
- [ ] Reset
- [ ] 0.07–16x clamp
- [ ] configurable increment
- [ ] preferred speed
- [ ] rate fightback
- [ ] intentional native rate change recognition

### Seek

- [ ] rewind
- [ ] forward
- [ ] configurable seek amount

### Marker

- [ ] set
- [ ] jump

### Overlay

- [ ] speed indicator
- [ ] expanded controls
- [ ] drag
- [ ] hide/show
- [ ] Shadow DOM
- [ ] fullscreen handling

### Keyboard

- [ ] default shortcuts
- [ ] shortcut customization
- [ ] modifier support
- [ ] input safety
- [ ] conflict handling

### Persistence

- [ ] default speed
- [ ] remember speed
- [ ] per-site default
- [ ] per-site disable
- [ ] storage migrations

### Extension UI

- [ ] popup
- [ ] full options page

### Quality

- [ ] unit tests
- [ ] browser integration tests
- [ ] accessibility
- [ ] no remote tracking
- [ ] minimal permissions

---

# 74. V1.1 Improvements

After stable parity:

## Quick Speed Presets

```text
1x  1.25x  1.5x  1.75x  2x  3x
```

## Remaining Real-Time Indicator

At `2x`:

```text
Video remaining: 20:00
Real viewing time: 10:00
```

Formula:

```ts
effectiveRemaining =
  (duration - currentTime) / playbackRate;
```

## Current Tab Media List

Popup:

```text
YouTube video       2.0x
Preview video       paused
```

## Keep Controller Expanded

Optional setting.

---

# 75. V1.2 Smart Improvements

These differentiate our clone without compromising reliability.

## Smart Per-Site Profiles

Automatically save preferred speed per site after repeated usage—but **only if user enables this behavior**.

## Temporary Speed Hold

Example:

```text
Hold `Q` → 3x
Release `Q` → previous speed
```

Useful for rapidly skimming.

## Speed Preset Cycling

One shortcut cycles:

```text
1x → 1.25x → 1.5x → 2x → 3x → 1x
```

## Fine / Coarse Adjustment

```text
D            +0.1x
Shift + D    +0.5x
```

---

# 76. Optional V2 — Silence-Aware Speed

Potential advanced feature:

Accelerate quiet sections automatically.

Architecture:

```text
Web Audio analyser
    ↓
voice/activity heuristic
    ↓
temporary playback rate
```

Risks:

- CPU use;
- browser restrictions;
- false positives;
- protected media compatibility.

Therefore not V1.

---

# 77. Optional V2 — Saved Time Analytics

Local-only metric:

```text
original viewing duration
vs
estimated actual viewing duration
```

Example:

```text
This week
Normal-duration equivalent: 8h 12m
Actual watch time:          4h 36m
Estimated time saved:       3h 36m
```

Store locally only.

Explicit opt-in recommended.

---

# 78. Better UI Than Reference

Do not clone visuals pixel-for-pixel.

Suggested style:

### Overlay

- compact dark translucent pill;
- 8px radius;
- subtle backdrop blur;
- white text;
- clear focus state;
- no huge shadows;
- 32px minimum controls;
- low visual footprint.

### Popup

Width:

`320–360px`

Sections:

```text
Current
Presets
Site
Settings
```

### Options Page

Desktop-first responsive settings interface.

Left navigation:

```text
General
Shortcuts
Controller
Sites
Advanced
```

No dashboard-style visual clutter.

---

# 79. Settings Defaults

Recommended:

```ts
const DEFAULT_SETTINGS = {
  enabled: true,

  defaultSpeed: 1,
  preferredSpeed: 1.8,
  speedStep: 0.1,

  rewindSeconds: 10,
  advanceSeconds: 10,

  rememberPlaybackSpeed: false,
  lastSpeed: 1,

  overlay: {
    enabled: true,
    position: {
      xRatio: 0.02,
      yRatio: 0.02
    },
    opacity: 0.9,
    customCss: ""
  },

  compatibility: {
    fightAutomaticRateReset: true
  }
};
```

---

# 80. Site Disable Rules

Ship only carefully justified defaults.

Do not arbitrarily disable high-value sites.

For problematic video-conferencing pages, consider disabling by default if playback manipulation could interfere with live calls.

Always let user override.

---

# 81. Live Media

Detect:

```ts
!Number.isFinite(media.duration)
```

or seekable ranges that represent live streams.

Behavior:

- speed may work depending on platform;
- marker/seek might be unavailable;
- never throw;
- disable unsupported overlay buttons visually.

---

# 82. Active Media Detection

Use `IntersectionObserver`.

Track:

```ts
intersectionRatio
```

Approximate visible area:

```ts
rect.width * rect.height * intersectionRatio
```

Selection score example:

```text
playing                      +1000
recent interaction           +2000
visible                       +500
large visible area            +normalized bonus
muted/background             -100
```

Keep scoring simple and testable.

---

# 83. Overlay Z-Index

A universal extension will encounter extreme site z-index values.

Use a high but valid value:

```css
z-index: 2147483647;
```

Only inside controller scope.

Do not blanket-change webpage z-index.

---

# 84. Mutation Observer Performance

Bad:

```ts
new MutationObserver(() => {
  document.querySelectorAll("video,audio");
});
```

Good:

only inspect added subtrees.

For mutation bursts, batch handling into a microtask or short scheduled queue.

---

# 85. Event Listener Cleanup

Every `MediaController` must expose:

```ts
destroy()
```

It removes:

- event listeners;
- observers;
- overlay;
- timers.

Use `AbortController` for easy cleanup:

```ts
const abort = new AbortController();

media.addEventListener("ratechange", fn, {
  signal: abort.signal
});

destroy() {
  abort.abort();
}
```

---

# 86. Cross-Frame Popup Commands

Popup may ask active tab:

```text
get-media-state
set-speed
toggle-enabled-for-site
```

Service worker sends message to tab/frame.

If multiple frames respond:

- choose active/visible media frame;
- or aggregate states.

V1 popup can keep this simple and operate on the active frame/media.

---

# 87. Debug Mode

Local developer-only debug setting.

Log:

```text
[Velocity][media] registered
[Velocity][rate] extension 1.5
[Velocity][rate] site-auto 1.0 → restore 1.5
[Velocity][intent] trusted interaction detected
```

Never include video titles or page content unnecessarily.

---

# 88. Build Commands

Suggested:

```json
{
  "scripts": {
    "dev": "node scripts/build.mjs --watch",
    "build": "node scripts/build.mjs",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:browser": "node tests/browser/run.mjs",
    "verify": "npm run lint && npm run test && npm run build",
    "package": "node scripts/package.mjs"
  }
}
```

---

# 89. Output Directory

```text
dist/
├── manifest.json
├── background.js
├── isolated-bridge.js
├── main-entry.js
├── ui/
├── styles/
└── assets/
```

`dist/` should load directly via:

```text
chrome://extensions
→ Developer mode
→ Load unpacked
→ dist/
```

---

# 90. Development Workflow

Recommended AI-driven workflow:

```text
spec
↓
architecture skeleton
↓
tests for core rate behavior
↓
media discovery
↓
speed engine
↓
keyboard actions
↓
overlay
↓
storage/settings
↓
site rules
↓
rate arbiter
↓
site compatibility
↓
browser integration tests
↓
Chrome Store hardening
```

Avoid building beautiful UI before playback behavior is reliable.

---

# 91. Implementation Phases

## Phase 0 — Scaffold

- TypeScript
- esbuild
- manifest
- lint
- tests
- dev package

Acceptance:

Extension loads with zero errors.

---

## Phase 1 — Media Engine

Implement:

- media observer;
- registry;
- controller;
- exact speed set;
- speed up/down/reset;
- seek.

Acceptance:

Fixture videos and audio work.

---

## Phase 2 — Keyboard

Implement:

- shortcuts;
- active-media selection;
- typing protection.

Acceptance:

Default shortcut matrix passes tests.

---

## Phase 3 — Overlay

Implement:

- Shadow DOM;
- speed label;
- buttons;
- hover expansion;
- dragging;
- visibility.

Acceptance:

Overlay survives hostile fixture CSS.

---

## Phase 4 — Settings

Implement:

- storage schema;
- defaults;
- migration;
- isolated/main bridge;
- options UI.

Acceptance:

Settings persist across browser restart.

---

## Phase 5 — Persistence + Site Rules

Implement:

- remember last speed;
- per-site default;
- disabled sites.

Acceptance:

Correct priority rules across test domains.

---

## Phase 6 — Rate Arbiter

Implement:

- change ownership;
- trusted user interaction;
- automatic reset detection;
- correction loop protection.

Acceptance:

Automatic player resets are corrected while user-native speed changes remain respected.

---

## Phase 7 — Site Compatibility

Test and add targeted handlers.

Priority:

1. YouTube
2. Netflix
3. Amazon
4. Coursera
5. Udemy
6. Vimeo
7. Dailymotion
8. Facebook/Instagram
9. Twitch

Acceptance:

No major regression in documented test matrix.

---

## Phase 8 — Popup

Implement current media state and quick presets.

Acceptance:

Works on single-media and no-media tabs.

---

## Phase 9 — Hardening

- accessibility;
- CSP;
- memory leaks;
- observer cleanup;
- keyboard conflicts;
- fullscreen;
- iframe behavior;
- local file behavior.

---

## Phase 10 — Store Release

Prepare:

- unique name;
- unique icon;
- screenshots;
- privacy policy;
- store description;
- source license attribution where applicable;
- zip package.

---

# 92. Definition of Done

Release candidate cannot be called finished until:

```text
[ ] npm run lint passes
[ ] npm run test passes
[ ] browser integration suite passes
[ ] build completes cleanly
[ ] unpacked extension loads without warnings
[ ] no uncaught errors on fixture pages
[ ] YouTube basic matrix passes
[ ] Netflix basic matrix passes
[ ] Coursera/Udemy test passes
[ ] iframe test passes
[ ] dynamic video test passes
[ ] aggressive reset test passes
[ ] site-native speed change test passes
[ ] fullscreen test passes
[ ] multiple video selection test passes
[ ] input-field shortcut safety passes
[ ] settings migration test passes
[ ] privacy review passes
[ ] permission review passes
```

---

# 93. Chrome Web Store Readiness

Use only permissions actually necessary.

Initial target:

```text
storage
```

Broad website matching is required for universal functionality, but explain clearly in store disclosures that webpage access is necessary solely to discover and control HTML5 media.

Do not:

- sell browsing data;
- inject ads;
- remotely execute code;
- silently add unrelated features.

---

# 94. Branding / Legal Boundary

The reference project is open source under the MIT License.

If any source is copied or adapted directly:

- preserve required MIT notice;
- include attribution in source/distribution as required by the license.

Regardless of code license:

- use a different product name;
- create a new icon;
- create original screenshots;
- create original store copy;
- do not claim affiliation with the original author.

A functional clone is fine; deceptive impersonation is not the goal.

---

# 95. Critical Engineering Rule

Do not solve compatibility by continuously hammering:

```ts
setInterval(() => {
  video.playbackRate = desiredRate;
}, 50);
```

This is unacceptable because it:

- wastes CPU;
- fights intentional user actions;
- can break players;
- scales badly with many videos.

Use event-driven arbitration.

---

# 96. Critical UI Rule

Do not attach uncontrolled global CSS to page DOM.

Bad:

```css
button { ... }
```

Use Shadow DOM scoped styles.

---

# 97. Critical Observer Rule

Do not continuously scan the whole webpage.

Use incremental mutation processing + weak references.

---

# 98. Critical Keyboard Rule

Never steal normal typing.

Matched shortcuts must be ignored in text-editing contexts unless user explicitly configures otherwise.

---

# 99. Critical Privacy Rule

The extension must function completely offline.

No API key.

No server.

No account.

No required internet service other than the webpage the user already visits.

---

# 100. Recommended Differentiation

Our version should win through:

1. cleaner modern interface;
2. stronger per-site profiles;
3. reliable native-player coexistence;
4. remaining-time-at-current-speed display;
5. temporary speed hold;
6. fine/coarse shortcut adjustments;
7. excellent keyboard customization;
8. local-only time-saved analytics later;
9. better accessibility;
10. strict privacy.

Do not differentiate by stuffing dozens of unrelated features into V1.

---

# 101. Suggested Final V1 User Experience

User installs Velocity.

They open YouTube.

A small:

```text
1×
```

badge appears on the video.

They press:

```text
D
```

and instantly see:

```text
1.1×
```

Repeated presses increase the speed.

They press:

```text
G
```

and jump to:

```text
1.8×
```

They hover over the badge and get:

```text
⏪   −   1.8×   +   ⏩
```

They drag the controller to a preferred location.

They set:

```text
coursera.org → default speed 2×
```

From then onward Coursera automatically opens at 2×.

If Coursera's player automatically resets speed to 1×, Velocity restores 2×.

If the user intentionally selects 1.5× using Coursera's own speed menu, Velocity recognizes it as user intent and accepts 1.5× rather than fighting the user.

That final behavior is what separates a robust clone from a basic playback-rate script.

---

# 102. Recommended Initial Coding Order

An AI coding agent should implement files in roughly this order:

```text
1. package.json
2. tsconfig.json
3. manifest.json
4. build scripts
5. constants
6. storage defaults/schema
7. MediaController
8. MediaRegistry
9. MediaObserver
10. action types
11. ActionHandler
12. active-media SelectionManager
13. ShortcutManager
14. core unit tests
15. overlay Custom Element
16. Shadow DOM styles
17. drag handler
18. settings manager
19. isolated bridge
20. settings page
21. per-site rule engine
22. remember-speed persistence
23. IntentClassifier
24. SpeedArbiter
25. arbiter unit tests
26. base site handler
27. YouTube handler
28. other handlers only as needed
29. popup
30. browser fixtures
31. browser integration suite
32. release hardening
```

---

# 103. AI Agent Implementation Rules

Give the coding agent these constraints:

```text
- Work phase-by-phase.
- Do not implement future phases prematurely.
- Keep MAIN-world code independent of chrome.* APIs.
- Use event-driven architecture.
- Never poll playbackRate continuously.
- Use WeakMap for media element ownership.
- Every controller must implement deterministic cleanup.
- Every persisted settings change needs schema validation.
- Do not add dependencies without explaining why.
- Do not add telemetry.
- Do not add remote APIs.
- Do not increase permissions without explicit justification.
- Add tests before claiming a core behavior complete.
- Verify browser behavior rather than assuming jsdom behavior matches Chrome.
- Site-specific hacks must be isolated in handlers.
- Generic functionality must not contain random hostname checks.
```

---

# 104. Suggested Core Interfaces

```ts
interface MediaController {
  readonly media: HTMLMediaElement;

  setRate(rate: number, source: RateSource): void;
  increaseRate(): void;
  decreaseRate(): void;
  resetRate(): void;

  seekBy(seconds: number): void;

  setMarker(): void;
  jumpToMarker(): void;

  togglePreferredRate(): void;

  destroy(): void;
}
```

```ts
interface SpeedArbiter {
  desiredRate: number;

  extensionRequested(rate: number): void;

  observeRateChange(
    observedRate: number,
    context: RateChangeContext
  ): RateDecision;
}
```

```ts
type RateDecision =
  | {
      type: "accept";
      rate: number;
    }
  | {
      type: "restore";
      rate: number;
    }
  | {
      type: "ignore";
    };
```

---

# 105. Settings Conflict Example

User configuration:

```text
Global default = 1.25x
Remember last speed = ON
Last speed = 1.75x
coursera.org default = 2x
```

Expected:

```text
YouTube → 1.75x
Coursera → 2x
```

because explicit per-site rule takes priority.

Document and test this priority.

---

# 106. Graceful Degradation

If overlay mounting fails:

keyboard control must still work.

If keyboard listener is blocked:

popup controls should still work where possible.

If a site rejects playbackRate:

do not repeatedly throw.

If storage fails:

fall back to safe defaults.

One subsystem failure must not kill the entire extension.

---

# 107. No-Framework Rationale

For an extension injected into millions of arbitrary pages, small runtime size and predictable DOM interaction matter.

Native TypeScript/JS is preferable because:

- no framework hydration;
- less bundle size;
- fewer dependencies;
- fewer CSP complications;
- easier DOM lifecycle control;
- faster content-script startup.

A UI framework can be reconsidered later only for the extension's standalone options page.

---

# 108. Release Versioning

Use semantic versioning:

```text
1.0.0 parity/stable launch
1.1.0 remaining-time + quick presets
1.2.0 smart shortcut improvements
2.0.0 only for substantial architecture/product change
```

---

# 109. Final Product Scope Statement

**Velocity is a privacy-first universal HTML5 media playback controller that provides precise speed, seeking and shortcut control while cooperating intelligently with site-native video players.**

The engineering priority order is:

```text
Reliability
> Compatibility
> Performance
> Privacy
> Accessibility
> UI polish
> Advanced features
```

---

# 110. Research Sources

Primary references analyzed for this specification:

1. Ilya Grigorik — `igrigorik/videospeed` GitHub repository  
   `https://github.com/igrigorik/videospeed`

2. Chrome Web Store — Video Speed Controller  
   Extension ID:  
   `nffaoalbilbmmfgbnbgppjihopabppdk`

3. Reference repository manifest and source layout, including:
   - `manifest.json`
   - `src/core/`
   - `src/entries/`
   - `src/observers/`
   - `src/site-handlers/`
   - `src/ui/`
   - `tests/`
   - formal specifications under `specs/`

Research snapshot: **September 2026**.

At the time of analysis, the Chrome Web Store listed the reference extension as version **0.11.1**, updated **15 August 2026**, with approximately **3,000,000 users**.

---

# 111. Final Recommendation

Do **not** start by blindly copying the entire upstream repository.

Best implementation path:

```text
Reference behavior
      ↓
Clean TypeScript architecture
      ↓
Feature-parity core
      ↓
Rate arbitration
      ↓
Real-browser testing
      ↓
Targeted site handlers
      ↓
Modern unique UI
      ↓
Store-safe release
```

The two components that deserve the most engineering attention are:

1. **Speed Arbiter + User Intent Classifier**
2. **Media discovery / lifecycle across SPAs and iframes**

If these are excellent, the extension will feel significantly more reliable than most basic speed-controller clones.

If these are weak, no amount of UI polish will make the product production-quality.
