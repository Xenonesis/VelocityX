import { SiteHandler } from "./base-handler";
import { matchesDomainPattern } from "../utils/domain";

export class NetflixHandler implements SiteHandler {
  readonly name = "Netflix";

  matches(location: Location): boolean {
    return matchesDomainPattern("netflix.com", location.hostname);
  }

  getMediaContainer(media: HTMLMediaElement): HTMLElement | null {
    const netflixPlayer = media.closest(
      ".watch-video, .AkiraPlayer, .sizing-wrapper, .nfp"
    );
    if (netflixPlayer instanceof HTMLElement) {
      return netflixPlayer;
    }
    return (media.parentElement || media.parentNode) as HTMLElement | null;
  }
}
