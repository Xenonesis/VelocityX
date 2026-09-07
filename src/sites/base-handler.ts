import { MediaController } from "../core/media-controller";
import { RateSource } from "../core/constants";

export interface SiteHandler {
  readonly name: string;
  matches(location: Location): boolean;
  getMediaContainer?(media: HTMLMediaElement): HTMLElement | null;
  onMediaAdded?(media: HTMLMediaElement, controller: MediaController): void;
  classifyRateChange?(event: Event, media: HTMLMediaElement): RateSource | undefined;
  cleanup?(): void;
}
