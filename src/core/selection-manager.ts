import { MediaController } from "./media-controller";
import { MediaRegistry } from "./media-registry";

export class SelectionManager {
  private readonly registry: MediaRegistry;

  constructor(registry: MediaRegistry) {
    this.registry = registry;
  }

  /**
   * Scores and returns the active media controller for user actions.
   */
  getActiveController(): MediaController | null {
    const controllers = this.registry.getAll();
    if (controllers.length === 0) return null;
    if (controllers.length === 1) return controllers[0];

    let bestCtrl: MediaController | null = null;
    let highestScore = -Infinity;

    const now = Date.now();

    for (const ctrl of controllers) {
      if (ctrl.destroyed) continue;

      const media = ctrl.media;
      let score = 0;

      // 0. Disconnected DOM elements should not be selected
      if (!media.isConnected) {
        score -= 10000;
      }

      // 1. Playing status (+1000)
      if (!media.paused && !media.ended && media.readyState > 1) {
        score += 1000;
      }

      // 2. Recent user interaction within 5 seconds (+2000 bonus with decay)
      const elapsed = now - ctrl.lastInteractionAt;
      if (elapsed < 5000) {
        score += 2000 - Math.floor(elapsed / 5);
      }

      // 3. Visible area (+0 to +500)
      try {
        const rect = media.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const area = rect.width * rect.height;
          // Scale area: 640x360 = ~230,000 px -> gives ~230 bonus
          const areaBonus = Math.min(500, Math.floor(area / 1000));
          score += areaBonus;
        }
      } catch {
        // Ignored in non-browser/mock DOM
      }

      // 4. Muted / zero-volume background penalty (-100)
      if (media.muted || media.volume === 0) {
        score -= 100;
      }

      if (score > highestScore) {
        highestScore = score;
        bestCtrl = ctrl;
      }
    }

    return bestCtrl ?? controllers[0] ?? null;
  }
}
