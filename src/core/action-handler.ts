import { MediaController } from "./media-controller";
import { SelectionManager } from "./selection-manager";
import { DEFAULT_STEP, NORMAL_SPEED, DEFAULT_PREFERRED_SPEED } from "./constants";

export type MediaAction =
  | { type: "speed.increase"; step?: number }
  | { type: "speed.decrease"; step?: number }
  | { type: "speed.set"; value: number }
  | { type: "speed.reset"; target?: number }
  | { type: "speed.preferred.toggle"; preferred?: number }
  | { type: "seek.relative"; seconds: number }
  | { type: "overlay.toggle" }
  | { type: "marker.set" }
  | { type: "marker.jump" }
  | { type: "audio.boost.increase"; step?: number }
  | { type: "audio.boost.decrease"; step?: number }
  | { type: "audio.boost.set"; value: number }
  | { type: "pitch.toggle" }
  | { type: "pip.toggle" };

export interface ActionHandlerCallbacks {
  onOverlayToggle?: () => void;
  onActionExecuted?: (action: MediaAction, targetController: MediaController | null) => void;
}

export class ActionHandler {
  private readonly selectionManager: SelectionManager;
  private readonly callbacks: ActionHandlerCallbacks;

  constructor(selectionManager: SelectionManager, callbacks: ActionHandlerCallbacks = {}) {
    this.selectionManager = selectionManager;
    this.callbacks = callbacks;
  }

  /**
   * Executes a normalized MediaAction. Returns true if handled.
   */
  execute(action: MediaAction): boolean {
    if (action.type === "overlay.toggle") {
      this.callbacks.onOverlayToggle?.();
      this.callbacks.onActionExecuted?.(action, null);
      return true;
    }

    const controller = this.selectionManager.getActiveController();
    if (!controller || controller.destroyed) {
      return false;
    }

    switch (action.type) {
      case "speed.increase":
        controller.increaseRate(action.step ?? DEFAULT_STEP);
        break;
      case "speed.decrease":
        controller.decreaseRate(action.step ?? DEFAULT_STEP);
        break;
      case "speed.set":
        controller.setRate(action.value, "extension");
        break;
      case "speed.reset":
        controller.resetRate(action.target ?? NORMAL_SPEED);
        break;
      case "speed.preferred.toggle":
        controller.togglePreferredRate(action.preferred ?? DEFAULT_PREFERRED_SPEED);
        break;
      case "seek.relative":
        controller.seekBy(action.seconds);
        break;
      case "marker.set":
        controller.setMarker();
        break;
      case "marker.jump":
        controller.jumpToMarker();
        break;
      case "audio.boost.increase":
        controller.increaseAudioGain(action.step ?? 0.2);
        break;
      case "audio.boost.decrease":
        controller.decreaseAudioGain(action.step ?? 0.2);
        break;
      case "audio.boost.set":
        controller.setAudioGain(action.value);
        break;
      case "pitch.toggle":
        controller.togglePitch();
        break;
      case "pip.toggle":
        controller.togglePictureInPicture().catch(() => {});
        break;
      default:
        return false;
    }

    this.callbacks.onActionExecuted?.(action, controller);
    return true;
  }
}
