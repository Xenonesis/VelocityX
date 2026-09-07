import { isMediaElement } from "../utils/media";

export interface MediaObserverCallbacks {
  onMediaFound: (element: HTMLMediaElement) => void;
  onMediaRemoved?: (element: HTMLMediaElement) => void;
}

export class MediaObserver {
  private observer: MutationObserver | null = null;
  private readonly callbacks: MediaObserverCallbacks;
  private isObserving = false;

  constructor(callbacks: MediaObserverCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Scans existing media in root and attaches MutationObserver for newly added subtrees.
   */
  observe(root: Node = document): void {
    if (this.isObserving) return;
    this.isObserving = true;

    // 1. Initial lightweight query on provided root
    this.discoverMediaInSubtree(root);

    // 2. Observe subtree mutations
    this.observer = new MutationObserver((records) => {
      for (const record of records) {
        // Inspect added nodes
        for (let i = 0; i < record.addedNodes.length; i++) {
          const node = record.addedNodes[i];
          this.discoverMediaInSubtree(node);
        }

        // Inspect removed nodes
        if (this.callbacks.onMediaRemoved) {
          for (let i = 0; i < record.removedNodes.length; i++) {
            const node = record.removedNodes[i];
            this.handleRemovedSubtree(node);
          }
        }
      }
    });

    try {
      this.observer.observe(root, {
        childList: true,
        subtree: true,
      });
    } catch (err) {
      console.warn("[Velocity] MutationObserver failed to attach:", err);
    }
  }

  private discoverMediaInSubtree(node: Node): void {
    if (isMediaElement(node)) {
      this.callbacks.onMediaFound(node);
    }

    if (node instanceof Element || node instanceof Document || node instanceof DocumentFragment) {
      const descendants = node.querySelectorAll("video, audio");
      for (let i = 0; i < descendants.length; i++) {
        const descendant = descendants[i];
        if (isMediaElement(descendant)) {
          this.callbacks.onMediaFound(descendant);
        }
      }
    }
  }

  private handleRemovedSubtree(node: Node): void {
    if (isMediaElement(node)) {
      this.callbacks.onMediaRemoved?.(node);
    }

    if (node instanceof Element || node instanceof DocumentFragment) {
      const descendants = node.querySelectorAll("video, audio");
      for (let i = 0; i < descendants.length; i++) {
        const descendant = descendants[i];
        if (isMediaElement(descendant)) {
          this.callbacks.onMediaRemoved?.(descendant);
        }
      }
    }
  }

  disconnect(): void {
    if (!this.isObserving) return;
    this.isObserving = false;
    this.observer?.disconnect();
    this.observer = null;
  }
}
