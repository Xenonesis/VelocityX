/**
 * HTMLMediaElement type guards and utility helpers
 */

export function isMediaElement(node: unknown): node is HTMLMediaElement {
  return node instanceof HTMLMediaElement;
}

export function isVideoElement(node: unknown): node is HTMLVideoElement {
  return node instanceof HTMLVideoElement;
}

export function isAudioElement(node: unknown): node is HTMLAudioElement {
  return node instanceof HTMLAudioElement;
}

export function isLiveMedia(media: HTMLMediaElement): boolean {
  return !Number.isFinite(media.duration) || media.duration === Infinity;
}

export function getMediaVisibleArea(media: HTMLMediaElement): number {
  if (media.tagName.toLowerCase() === "audio") return 0;
  const rect = media.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return 0;
  return rect.width * rect.height;
}
