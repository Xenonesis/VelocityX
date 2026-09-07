import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShortcutManager, isEditableTarget, ShortcutBinding } from "@/core/shortcut-manager";
import { ActionHandler } from "@/core/action-handler";
import { MediaRegistry } from "@/core/media-registry";
import { SelectionManager } from "@/core/selection-manager";
import { MediaController } from "@/core/media-controller";

describe("ShortcutManager & Input Safety", () => {
  let registry: MediaRegistry;
  let selectionManager: SelectionManager;
  let actionHandler: ActionHandler;
  let controller: MediaController;
  let video: HTMLVideoElement;

  beforeEach(() => {
    registry = new MediaRegistry();
    selectionManager = new SelectionManager(registry);
    actionHandler = new ActionHandler(selectionManager);

    video = document.createElement("video");
    Object.defineProperty(video, "duration", { value: 120, writable: true, configurable: true });
    document.body.appendChild(video);
    controller = registry.register(video, 1.0);
  });

  function fireKeyDown(target: EventTarget, code: string, options: Partial<KeyboardEventInit> = {}) {
    const evt = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code,
      key: code,
      ...options,
    });
    target.dispatchEvent(evt);
    return evt;
  }

  it("triggers speed increase on KeyD and decrease on KeyS", () => {
    const manager = new ShortcutManager(actionHandler);
    manager.attach(window);

    fireKeyDown(window, "KeyD");
    expect(controller.desiredRate).toBe(1.1);

    fireKeyDown(window, "KeyS");
    expect(controller.desiredRate).toBe(1.0);

    manager.detach();
  });

  it("triggers reset on KeyR and preferred toggle on KeyG", () => {
    const manager = new ShortcutManager(actionHandler);
    manager.attach(window);

    controller.setRate(2.5);
    fireKeyDown(window, "KeyR");
    expect(controller.desiredRate).toBe(1.0);

    fireKeyDown(window, "KeyG");
    expect(controller.desiredRate).toBe(1.8);

    manager.detach();
  });

  it("triggers rewind (KeyZ) and forward (KeyX)", () => {
    const manager = new ShortcutManager(actionHandler);
    manager.attach(window);

    video.currentTime = 50;
    fireKeyDown(window, "KeyZ");
    expect(video.currentTime).toBe(40);

    fireKeyDown(window, "KeyX");
    expect(video.currentTime).toBe(50);

    manager.detach();
  });

  it("handles marker set (KeyM) and jump (KeyJ)", () => {
    const manager = new ShortcutManager(actionHandler);
    manager.attach(window);

    video.currentTime = 77;
    fireKeyDown(window, "KeyM");
    expect(controller.markerTime).toBe(77);

    video.currentTime = 10;
    fireKeyDown(window, "KeyJ");
    expect(video.currentTime).toBe(77);

    manager.detach();
  });

  it("never executes shortcuts when typing in editable targets", () => {
    const manager = new ShortcutManager(actionHandler);
    manager.attach(window);

    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const editableDiv = document.createElement("div");
    editableDiv.setAttribute("contenteditable", "true");
    const ariaBox = document.createElement("div");
    ariaBox.setAttribute("role", "textbox");

    document.body.appendChild(input);
    document.body.appendChild(textarea);
    document.body.appendChild(editableDiv);
    document.body.appendChild(ariaBox);

    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(textarea)).toBe(true);
    expect(isEditableTarget(editableDiv)).toBe(true);
    expect(isEditableTarget(ariaBox)).toBe(true);

    // Rate should stay at 1.0 even when KeyD is pressed inside input
    fireKeyDown(input, "KeyD");
    expect(controller.desiredRate).toBe(1.0);

    fireKeyDown(textarea, "KeyD");
    expect(controller.desiredRate).toBe(1.0);

    fireKeyDown(editableDiv, "KeyD");
    expect(controller.desiredRate).toBe(1.0);

    fireKeyDown(ariaBox, "KeyD");
    expect(controller.desiredRate).toBe(1.0);

    manager.detach();
  });

  it("ignores shortcut during IME composition", () => {
    const manager = new ShortcutManager(actionHandler);
    manager.attach(window);

    fireKeyDown(window, "KeyD", { isComposing: true });
    expect(controller.desiredRate).toBe(1.0);

    manager.detach();
  });

  it("matches modifier combinations strictly", () => {
    const customShortcuts: ShortcutBinding[] = [
      {
        id: "custom.speed.up",
        action: { type: "speed.increase", step: 0.5 },
        code: "KeyD",
        ctrl: true,
        alt: false,
        shift: true,
        meta: false,
        enabled: true,
      },
    ];

    const manager = new ShortcutManager(actionHandler, customShortcuts);
    manager.attach(window);

    // Plain D should not match
    fireKeyDown(window, "KeyD");
    expect(controller.desiredRate).toBe(1.0);

    // Ctrl + D should not match because Shift is missing
    fireKeyDown(window, "KeyD", { ctrlKey: true });
    expect(controller.desiredRate).toBe(1.0);

    // Ctrl + Shift + D matches!
    fireKeyDown(window, "KeyD", { ctrlKey: true, shiftKey: true });
    expect(controller.desiredRate).toBe(1.5);

    manager.detach();
  });
});
