import { ActionHandler, MediaAction } from "./action-handler";
import { DEFAULT_ADVANCE_SECONDS, DEFAULT_REWIND_SECONDS } from "./constants";

export interface ShortcutBinding {
  id: string;
  action: MediaAction;
  code: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  enabled: boolean;
}

export const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  {
    id: "speed.decrease",
    action: { type: "speed.decrease" },
    code: "KeyS",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    enabled: true,
  },
  {
    id: "speed.increase",
    action: { type: "speed.increase" },
    code: "KeyD",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    enabled: true,
  },
  {
    id: "speed.reset",
    action: { type: "speed.reset" },
    code: "KeyR",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    enabled: true,
  },
  {
    id: "seek.rewind",
    action: { type: "seek.relative", seconds: -DEFAULT_REWIND_SECONDS },
    code: "KeyZ",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    enabled: true,
  },
  {
    id: "seek.advance",
    action: { type: "seek.relative", seconds: DEFAULT_ADVANCE_SECONDS },
    code: "KeyX",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    enabled: true,
  },
  {
    id: "speed.preferred.toggle",
    action: { type: "speed.preferred.toggle" },
    code: "KeyG",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    enabled: true,
  },
  {
    id: "overlay.toggle",
    action: { type: "overlay.toggle" },
    code: "KeyV",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    enabled: true,
  },
  {
    id: "marker.set",
    action: { type: "marker.set" },
    code: "KeyM",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    enabled: true,
  },
  {
    id: "marker.jump",
    action: { type: "marker.jump" },
    code: "KeyJ",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    enabled: true,
  },
  {
    id: "pip.toggle",
    action: { type: "pip.toggle" },
    code: "KeyP",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    enabled: true,
  },
  {
    id: "silence.skip.toggle",
    action: { type: "silence.skip.toggle" },
    code: "KeyK",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    enabled: true,
  },
];

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }

  if (
    Boolean(target.isContentEditable) ||
    target.contentEditable === "true" ||
    target.getAttribute("contenteditable") === "true" ||
    target.getAttribute("contenteditable") === "" ||
    Boolean(target.closest?.("[contenteditable='true'], [contenteditable=''], [contenteditable]"))
  ) {
    return true;
  }

  const role = target.getAttribute("role");
  if (role === "textbox" || role === "searchbox" || role === "combobox") {
    return true;
  }

  return false;
}

export class ShortcutManager {
  private readonly actionHandler: ActionHandler;
  private shortcuts: ShortcutBinding[];
  private abortController: AbortController | null = null;
  enabled = true;

  constructor(actionHandler: ActionHandler, shortcuts: ShortcutBinding[] = DEFAULT_SHORTCUTS) {
    this.actionHandler = actionHandler;
    this.shortcuts = [...shortcuts];
  }

  setShortcuts(shortcuts: ShortcutBinding[]): void {
    this.shortcuts = [...shortcuts];
  }

  getShortcuts(): ShortcutBinding[] {
    return [...this.shortcuts];
  }

  attach(target: EventTarget = window): void {
    this.detach();
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    target.addEventListener(
      "keydown",
      (e: Event) => {
        if (!this.enabled) return;
        if (!(e instanceof KeyboardEvent)) return;

        // Skip during IME composition
        if (e.isComposing) return;

        // Never steal normal typing in text fields
        if (isEditableTarget(e.target)) return;

        this.handleKeyDown(e);
      },
      { capture: true, signal }
    );
  }

  private handleKeyDown(e: KeyboardEvent): void {
    for (const binding of this.shortcuts) {
      if (!binding.enabled) continue;

      const codeMatches = binding.code === e.code;
      const ctrlMatches = binding.ctrl === (e.ctrlKey || e.metaKey);
      const altMatches = binding.alt === e.altKey;
      const shiftMatches = binding.shift === e.shiftKey;

      if (codeMatches && ctrlMatches && altMatches && shiftMatches) {
        e.preventDefault();
        e.stopPropagation();
        this.actionHandler.execute(binding.action);
        return;
      }
    }
  }

  detach(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
