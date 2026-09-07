import { MediaController, MediaControllerEvents } from "./media-controller";
import { NORMAL_SPEED } from "./constants";

export interface MediaRegistryEvents {
  onRegistered?: (controller: MediaController) => void;
  onUnregistered?: (controller: MediaController) => void;
}

export class MediaRegistry {
  private readonly mediaMap = new WeakMap<HTMLMediaElement, MediaController>();
  private readonly controllers = new Set<MediaController>();
  private readonly events: MediaRegistryEvents;

  constructor(events: MediaRegistryEvents = {}) {
    this.events = events;
  }

  /**
   * Registers a media element. Idempotent: returns existing controller if already registered.
   */
  register(
    media: HTMLMediaElement,
    initialRate = NORMAL_SPEED,
    extraEvents: MediaControllerEvents = {}
  ): MediaController {
    const existing = this.mediaMap.get(media);
    if (existing && !existing.destroyed) {
      return existing;
    }

    const controller = new MediaController(media, initialRate, {
      ...extraEvents,
      onDestroy: (ctrl) => {
        this.controllers.delete(ctrl);
        extraEvents.onDestroy?.(ctrl);
        this.events.onUnregistered?.(ctrl);
      },
    });

    this.mediaMap.set(media, controller);
    this.controllers.add(controller);
    this.events.onRegistered?.(controller);

    return controller;
  }

  /**
   * Retrieves controller for media element if tracked.
   */
  get(media: HTMLMediaElement): MediaController | undefined {
    const ctrl = this.mediaMap.get(media);
    if (ctrl?.destroyed) {
      this.controllers.delete(ctrl);
      return undefined;
    }
    return ctrl;
  }

  /**
   * Unregisters and destroys controller for a media element.
   */
  unregister(media: HTMLMediaElement): void {
    const ctrl = this.mediaMap.get(media);
    if (ctrl) {
      ctrl.destroy();
      this.controllers.delete(ctrl);
    }
  }

  /**
   * Returns all currently active media controllers.
   */
  getAll(): MediaController[] {
    const active: MediaController[] = [];
    for (const ctrl of this.controllers) {
      if (!ctrl.destroyed) {
        active.push(ctrl);
      } else {
        this.controllers.delete(ctrl);
      }
    }
    return active;
  }

  /**
   * Destroys and clears all registered controllers.
   */
  clear(): void {
    for (const ctrl of this.controllers) {
      ctrl.destroy();
    }
    this.controllers.clear();
  }
}
