import { MediaController } from "../../core/media-controller";
import { formatRate } from "../../core/constants";
import { DragHandler, DragPosition } from "./drag-handler";

const OVERLAY_STYLE = `
:host {
  all: initial !important;
  display: block !important;
  position: absolute !important;
  z-index: 2147483647 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  font-size: 15px !important;
  line-height: 1 !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  pointer-events: auto !important;
  touch-action: none !important;
}

:host([data-hidden="true"]) {
  display: none !important;
}

.velocity-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.72);
  cursor: grab;
  box-sizing: border-box;
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.velocity-pill:hover,
.velocity-pill.expanded,
.velocity-pill.dragging {
  background-color: rgba(0, 0, 0, 0.65);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  color: #ffffff;
}

.velocity-pill.dragging {
  cursor: grabbing;
}

.rate-badge {
  font-weight: 600;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.72);
  padding: 1px 3px;
  cursor: pointer;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
  transition: color 0.2s ease, text-shadow 0.2s ease;
}

.velocity-pill:hover .rate-badge,
.velocity-pill.expanded .rate-badge {
  color: #ffffff;
}

.rate-badge.highlight {
  color: #ffffff !important;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.9), 0 1px 3px rgba(0, 0, 0, 0.9) !important;
}

.controls-group {
  display: none;
  align-items: center;
  gap: 1px;
}

.velocity-pill:hover .controls-group,
.velocity-pill.expanded .controls-group,
.velocity-pill.dragging .controls-group {
  display: inline-flex;
}

.ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 19px;
  height: 19px;
  padding: 0 2px;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  transition: background-color 0.1s ease, color 0.1s ease;
}

.ctrl-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.ctrl-btn:focus-visible {
  outline: 1px solid rgba(255, 255, 255, 0.8);
}

.ctrl-btn:active {
  transform: scale(0.92);
}
`;

export class VelocityControllerElement extends HTMLElement {
  private readonly shadow: ShadowRoot;
  private pillElem!: HTMLDivElement;
  private rateBadge!: HTMLSpanElement;
  private dragHandler: DragHandler | null = null;
  private controller: MediaController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private currentPosition: DragPosition = { xRatio: 0.02, yRatio: 0.02 };
  private highlightTimer: number | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "closed" });
    this.render();
  }

  private render(): void {
    const style = document.createElement("style");
    style.textContent = OVERLAY_STYLE;

    this.pillElem = document.createElement("div");
    this.pillElem.className = "velocity-pill";

    // Left controls group: Rewind & Slower
    const leftGroup = document.createElement("div");
    leftGroup.className = "controls-group";

    const rewindBtn = document.createElement("button");
    rewindBtn.className = "ctrl-btn";
    rewindBtn.setAttribute("data-action", "rewind");
    rewindBtn.setAttribute("aria-label", "Rewind 10 seconds");
    rewindBtn.textContent = "«";

    const slowerBtn = document.createElement("button");
    slowerBtn.className = "ctrl-btn";
    slowerBtn.setAttribute("data-action", "slower");
    slowerBtn.setAttribute("aria-label", "Decrease playback speed");
    slowerBtn.textContent = "−";

    leftGroup.appendChild(rewindBtn);
    leftGroup.appendChild(slowerBtn);

    // Center rate badge (displays 2.20, 1.00, etc.)
    this.rateBadge = document.createElement("span");
    this.rateBadge.className = "rate-badge";
    this.rateBadge.setAttribute("data-action", "reset");
    this.rateBadge.setAttribute("aria-label", "Playback speed. Click to reset to 1.00");
    this.rateBadge.textContent = "1.00";

    // Right controls group: Faster, Advance, and Close
    const rightGroup = document.createElement("div");
    rightGroup.className = "controls-group";

    const fasterBtn = document.createElement("button");
    fasterBtn.className = "ctrl-btn";
    fasterBtn.setAttribute("data-action", "faster");
    fasterBtn.setAttribute("aria-label", "Increase playback speed");
    fasterBtn.textContent = "+";

    const advanceBtn = document.createElement("button");
    advanceBtn.className = "ctrl-btn";
    advanceBtn.setAttribute("data-action", "advance");
    advanceBtn.setAttribute("aria-label", "Advance 10 seconds");
    advanceBtn.textContent = "»";

    const closeBtn = document.createElement("button");
    closeBtn.className = "ctrl-btn";
    closeBtn.setAttribute("data-action", "close");
    closeBtn.setAttribute("aria-label", "Hide controller (Press V to toggle)");
    closeBtn.textContent = "×";

    rightGroup.appendChild(fasterBtn);
    rightGroup.appendChild(advanceBtn);
    rightGroup.appendChild(closeBtn);

    this.pillElem.appendChild(leftGroup);
    this.pillElem.appendChild(this.rateBadge);
    this.pillElem.appendChild(rightGroup);

    this.shadow.appendChild(style);
    this.shadow.appendChild(this.pillElem);

    this.bindClickActions();
  }

  private bindClickActions(): void {
    this.pillElem.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !this.controller) return;

      const action = target.getAttribute("data-action");
      if (!action) return;

      e.stopPropagation();
      e.preventDefault();

      switch (action) {
        case "rewind":
          this.controller.seekBy(-10);
          break;
        case "slower":
          this.controller.decreaseRate();
          break;
        case "reset":
          this.controller.resetRate();
          break;
        case "faster":
          this.controller.increaseRate();
          break;
        case "advance":
          this.controller.seekBy(10);
          break;
        case "close":
          this.setVisible(false);
          break;
      }
    });
  }

  /**
   * Connects this overlay element to a target MediaController and parent container.
   */
  attachController(
    controller: MediaController,
    container: HTMLElement,
    initialPos: DragPosition = { xRatio: 0.02, yRatio: 0.02 }
  ): void {
    this.controller = controller;
    this.currentPosition = initialPos;

    this.updateRateDisplay(controller.desiredRate);

    // Setup drag handling
    this.dragHandler?.destroy();
    this.dragHandler = new DragHandler(
      this.pillElem,
      () => container,
      initialPos,
      {
        onDragStart: () => {
          this.pillElem.classList.add("dragging");
        },
        onDrag: (pos) => {
          this.currentPosition = pos;
          this.updatePositionStyles(container);
        },
        onDragEnd: (pos) => {
          this.pillElem.classList.remove("dragging");
          this.currentPosition = pos;
          this.updatePositionStyles(container);
        },
      }
    );

    // Initial position update
    this.updatePositionStyles(container);

    // Setup ResizeObserver on container to adjust positioning on resize
    try {
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(() => {
        this.updatePositionStyles(container);
      });
      this.resizeObserver.observe(container);
    } catch {
      // Safe fallback if ResizeObserver is not available
    }
  }

  updateRateDisplay(rate: number): void {
    if (this.rateBadge) {
      this.rateBadge.textContent = formatRate(rate);

      // Briefly highlight rate change
      this.rateBadge.classList.add("highlight");
      clearTimeout(this.highlightTimer ?? undefined);
      this.highlightTimer = window.setTimeout(() => {
        this.rateBadge.classList.remove("highlight");
      }, 500);
    }
  }

  updatePositionStyles(container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const leftPx = Math.round(this.currentPosition.xRatio * rect.width);
    const topPx = Math.round(this.currentPosition.yRatio * rect.height);

    this.style.left = `${leftPx}px`;
    this.style.top = `${topPx}px`;
  }

  setVisible(visible: boolean): void {
    if (visible) {
      this.removeAttribute("data-hidden");
    } else {
      this.setAttribute("data-hidden", "true");
    }
  }

  destroy(): void {
    clearTimeout(this.highlightTimer ?? undefined);
    this.dragHandler?.destroy();
    this.dragHandler = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controller = null;
    this.remove();
  }
}

export function registerVelocityController(): void {
  const registry =
    typeof window !== "undefined"
      ? window.customElements
      : typeof customElements !== "undefined"
      ? customElements
      : null;
  if (registry && !registry.get("velocity-controller")) {
    registry.define("velocity-controller", VelocityControllerElement);
  }
}

registerVelocityController();
