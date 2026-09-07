# VelocityX Killer Features & Production Enhancements Implementation Plan

> **Goal:** Implement Floating HUD Toast OSD, Per-Domain Speed Memory, Web Audio Boost & Pitch Control, Deep Shadow DOM discovery, Picture-in-Picture mode, Enhanced Popup Quick Chips, and Store Zip Packaging.
> **Architecture:** Clean-room Manifest V3 modules running in ISOLATED bridge and MAIN worlds with Web Audio API, Closed Shadow DOM custom elements, and Chrome Storage Sync.
> **Tech Stack:** TypeScript, Web Audio API, Custom Elements (Shadow DOM), Vitest, esbuild.

---

## Task 1: Floating HUD Toast OSD (`src/ui/overlay/hud-toast.ts`)
- Design a sleek floating toast element that mounts over active media elements.
- Appears on key actions (`speed.increase`, `speed.decrease`, `speed.reset`, `speed.preferred.toggle`, `seek.relative`, `pip.toggle`, `audio.boost`).
- Renders text such as `⚡ 1.50x`, `⏪ 10s`, `🔊 200%`, `🖼️ PiP`.
- Automatically disappears after 1000ms with a smooth CSS fade-out transition.

## Task 2: Per-Domain Speed Memory (`src/core/site-rule-engine.ts`)
- Maintain a local map `domainSpeedMemory: Record<string, number>` in storage.
- When a user changes speed on a domain (e.g. `youtube.com`) and `rememberPlaybackSpeed` is active, update the domain entry.
- When new media elements load on that domain, restore the domain's last saved speed instead of the global default.

## Task 3: Web Audio Boost (up to 500%) & Pitch Preservation (`src/utils/audio-boost.ts`)
- Implement `AudioBooster` class using `AudioContext` and `GainNode`.
- Connect media element to audio context and allow setting volume multiplier (1.0x to 5.0x / 100% to 500%).
- Handle autoplay restrictions and resume suspended AudioContext on user gesture.
- Add `preservesPitch` toggle on HTMLMediaElement (`media.preservesPitch = true/false`).

## Task 4: Deep Shadow DOM Media Discovery & PiP (`src/observers/media-observer.ts`)
- Recursively traverse open shadow roots of custom web components to discover `<video>` and `<audio>` elements.
- Add `pip.toggle` action with shortcut (`KeyP`) using `document.pictureInPictureElement` and `requestPictureInPicture()`.

## Task 5: Popup Interactive Quick Chips & Store Packaging (`src/ui/popup/`, `scripts/package.ts`)
- Show current active speed in popup with live badge.
- Add quick speed chips `[ 0.75x ] [ 1.0x ] [ 1.25x ] [ 1.5x ] [ 1.75x ] [ 2.0x ] [ 2.5x ] [ 3.0x ]`.
- Create `scripts/package.ts` to bundle a clean, minimal `.zip` archive for Chrome Web Store upload.

## Task 6: Comprehensive Verification & GitHub Sync
- Unit tests for HUD toast, domain memory, audio boost, and PiP.
- Run full test suite, bundle verification, and git push.
