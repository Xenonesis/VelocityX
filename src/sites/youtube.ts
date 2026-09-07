import { SiteHandler } from "./base-handler";
import { MediaController } from "../core/media-controller";
import { matchesDomainPattern } from "../utils/domain";

export class YouTubeHandler implements SiteHandler {
  readonly name = "YouTube";
  private abortController: AbortController | null = null;
  private isPointerHolding = false;

  matches(location: Location): boolean {
    return matchesDomainPattern("youtube.com", location.hostname);
  }

  getMediaContainer(media: HTMLMediaElement): HTMLElement | null {
    // Look for YouTube's dedicated player shell
    const playerShell = media.closest(
      "#movie_player, .html5-video-player, ytd-player, .ytd-player"
    );
    if (playerShell instanceof HTMLElement) {
      return playerShell;
    }
    return (media.parentElement || media.parentNode) as HTMLElement | null;
  }

  onMediaAdded(media: HTMLMediaElement, controller: MediaController): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    // 1. YouTube press-and-hold 2x speed feature tracking
    media.addEventListener(
      "pointerdown",
      () => {
        this.isPointerHolding = true;
      },
      { signal, passive: true }
    );

    const onPointerRelease = () => {
      this.isPointerHolding = false;
    };
    window.addEventListener("pointerup", onPointerRelease, { signal });
    window.addEventListener("pointercancel", onPointerRelease, { signal });

    // 2. YouTube SPA navigation handler
    window.addEventListener(
      "yt-navigate-finish",
      () => {
        // When YouTube finishes client navigation, check media state
        try {
          if (media.isConnected && !controller.destroyed) {
            // Let YouTube initialize before restoring rate
            setTimeout(() => {
              if (media.playbackRate !== controller.desiredRate) {
                media.playbackRate = controller.desiredRate;
              }
            }, 100);
          }
        } catch {
          // Safe fallback
        }
      },
      { signal }
    );
  }

  classifyRateChange(_event: Event, media: HTMLMediaElement): "site-user" | undefined {
    // If user is holding mouse down on player, YouTube engages temporary 2x
    if (this.isPointerHolding && media.playbackRate === 2.0) {
      return "site-user";
    }
    return undefined;
  }

  cleanup(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
