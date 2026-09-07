import { describe, it, expect, vi } from "vitest";
import { SilenceDetector } from "@/utils/silence-detector";
import { MediaRegistry } from "@/core/media-registry";
import { SelectionManager } from "@/core/selection-manager";
import { ActionHandler } from "@/core/action-handler";

describe("SilenceDetector", () => {
  it("initializes with default options and starts/stops cleanly", () => {
    const video = document.createElement("video");
    const onSilenceChange = vi.fn();

    const detector = new SilenceDetector(video, {
      thresholdDb: -40,
      minSilenceMs: 300,
      checkIntervalMs: 50,
      onSilenceChange,
    });

    detector.start();
    detector.stop();
    detector.destroy();

    expect(onSilenceChange).not.toHaveBeenCalled();
  });

  it("handles media controller toggleSilenceSkip state transitions", () => {
    const video = document.createElement("video");
    const registry = new MediaRegistry();
    const ctrl = registry.register(video, 1.25);

    expect(ctrl.silenceSkipEnabled).toBe(false);

    // Toggle on
    ctrl.toggleSilenceSkip(true);
    expect(ctrl.silenceSkipEnabled).toBe(true);

    // Toggle off
    ctrl.toggleSilenceSkip(false);
    expect(ctrl.silenceSkipEnabled).toBe(false);

    ctrl.destroy();
  });

  it("dispatches silence.skip.toggle via ActionHandler", () => {
    const video = document.createElement("video");
    const registry = new MediaRegistry();
    const ctrl = registry.register(video, 1.5);
    const selection = new SelectionManager(registry);

    let executed = false;
    const handler = new ActionHandler(selection, {
      onActionExecuted: (action) => {
        if (action.type === "silence.skip.toggle") {
          executed = true;
        }
      },
    });

    handler.execute({ type: "silence.skip.toggle", enabled: true });
    expect(ctrl.silenceSkipEnabled).toBe(true);
    expect(executed).toBe(true);

    ctrl.destroy();
  });
});
