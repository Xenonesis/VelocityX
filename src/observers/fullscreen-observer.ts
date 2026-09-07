export type FullscreenChangeCallback = (
  isFullscreen: boolean,
  fullscreenElement: Element | null
) => void;

export class FullscreenObserver {
  private readonly callback: FullscreenChangeCallback;
  private readonly abortController = new AbortController();

  constructor(callback: FullscreenChangeCallback) {
    this.callback = callback;
    this.bindEvents();
  }

  private bindEvents(): void {
    const { signal } = this.abortController;
    const handler = () => {
      let fsElem: Element | null = null;
      if (document.fullscreenElement instanceof Element) {
        fsElem = document.fullscreenElement;
      } else if ("webkitFullscreenElement" in document) {
        const vendor = (document as Document & { webkitFullscreenElement?: unknown }).webkitFullscreenElement;
        if (vendor instanceof Element) {
          fsElem = vendor;
        }
      }
      const isFullscreen = fsElem !== null;
      this.callback(isFullscreen, fsElem);
    };

    document.addEventListener("fullscreenchange", handler, { signal });
    document.addEventListener("webkitfullscreenchange", handler, { signal });
  }

  destroy(): void {
    this.abortController.abort();
  }
}
