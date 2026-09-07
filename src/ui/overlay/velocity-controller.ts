import { MediaController } from "../../core/media-controller";
import { formatRate } from "../../core/constants";
import { DragHandler, DragPosition } from "./drag-handler";

const OVERLAY_STYLE = `
:host {
  all: initial !important;
  display: block !important;
  position: absolute !important;
  z-index: 2147483647 !important;
  font-family: sans-serif !important;
  font-size: 13px !important;
  line-height: 1.8em !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  pointer-events: auto !important;
  touch-action: none !important;
}

:host([data-hidden="true"]) {
  display: none !important;
}

#controller {
  display: inline-flex;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  background: black;
  color: white;
  border-radius: 6px;
  padding: 4px;
  margin: 10px 10px 10px 15px;
  cursor: default;
  white-space: nowrap;
  opacity: 0.3;
  box-sizing: border-box;
  transition: opacity 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

#controller:hover,
#controller.expanded,
#controller.dragging {
  opacity: 0.7 !important;
}

#controller.dragging {
  cursor: grabbing;
}

.draggable {
  cursor: grab;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.8em;
  height: 1.4em;
  text-align: center;
  vertical-align: middle;
  box-sizing: border-box;
  touch-action: none;
  font-family: sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  padding: 0 2px;
  transition: margin-right 0.2s ease;
}

.draggable:active {
  cursor: grabbing;
}

#controller:hover > .draggable,
#controller.expanded > .draggable {
  margin-right: 0.5em;
}

#controls {
  display: none;
  vertical-align: middle;
  align-items: center;
  gap: 2px;
}

#controller:hover #controls,
#controller.expanded #controls,
#controller.dragging #controls {
  display: inline-flex;
}

button.ctrl-btn {
  opacity: 1;
  cursor: pointer;
  color: black;
  background: white;
  font-weight: normal;
  border-radius: 5px;
  padding: 1px 5px 2px 5px;
  font-size: 13px;
  line-height: 16px;
  border: 0px solid white;
  font-family: "Lucida Console", Monaco, monospace;
  margin: 0px 2px;
  transition: background 0.15s ease, color 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

button.ctrl-btn:focus {
  outline: 0;
}

button.ctrl-btn:hover {
  opacity: 1;
  background: #2196f3;
  color: #ffffff;
}

button.ctrl-btn:active {
  background: #1976d2;
  color: #ffffff;
  font-weight: bold;
}

button.ctrl-btn.rw {
  opacity: 0.65;
}

button.ctrl-btn.rw:hover {
  opacity: 1;
}

button.ctrl-btn.close-btn {
  font-size: 14px;
  padding: 1px 6px;
  opacity: 0.75;
}

button.ctrl-btn.close-btn:hover {
  background: #e53935;
  color: #ffffff;
  opacity: 1;
}

.rate-badge.highlight {
  color: #64b5f6 !important;
  text-shadow: 0 0 8px rgba(100, 181, 246, 0.9) !important;
}
`;

export class VelocityControllerElement extends HTMLElement {
  private readonly shadow: ShadowRoot;
  private pillElem!: HTMLDivElement;
  private rateBadge!: HTMLSpanElement;
  private controlsGroup!: HTMLSpanElement;
  private dragHandler: DragHandler | null = null;
  private controller: MediaController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private currentPosition: DragPosition = { xRatio: 0.02, yRatio: 0.02 };
  private highlightTimer: number | null = null;
  private hoverStart = 0;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "closed" });
    this.render();
  }

  private render(): void {
    const style = document.createElement("style");
    style.textContent = OVERLAY_STYLE;

    this.pillElem = document.createElement("div");
    this.pillElem.id = "controller";
    this.pillElem.className = "velocity-controller";

    // Draggable rate badge on the left
    this.rateBadge = document.createElement("span");
    this.rateBadge.className = "draggable rate-badge";
    this.rateBadge.setAttribute("data-action", "drag");
    this.rateBadge.setAttribute(
      "aria-label",
      "Playback speed. Double click to reset to 1.00"
    );
    this.rateBadge.textContent = "1.00";

    // Controls group expanding to the right on hover
    this.controlsGroup = document.createElement("span");
    this.controlsGroup.id = "controls";
    this.controlsGroup.className = "controls-group";

    const rewindBtn = document.createElement("button");
    rewindBtn.className = "ctrl-btn rw";
    rewindBtn.setAttribute("data-action", "rewind");
    rewindBtn.setAttribute("aria-label", "Rewind 10 seconds");
    rewindBtn.textContent = "«";

    const slowerBtn = document.createElement("button");
    slowerBtn.className = "ctrl-btn";
    slowerBtn.setAttribute("data-action", "slower");
    slowerBtn.setAttribute("aria-label", "Decrease playback speed");
    slowerBtn.textContent = "−";

    const fasterBtn = document.createElement("button");
    fasterBtn.className = "ctrl-btn";
    fasterBtn.setAttribute("data-action", "faster");
    fasterBtn.setAttribute("aria-label", "Increase playback speed");
    fasterBtn.textContent = "+";

    const advanceBtn = document.createElement("button");
    advanceBtn.className = "ctrl-btn rw";
    advanceBtn.setAttribute("data-action", "advance");
    advanceBtn.setAttribute("aria-label", "Advance 10 seconds");
    advanceBtn.textContent = "»";

    const closeBtn = document.createElement("button");
    closeBtn.className = "ctrl-btn close-btn";
    closeBtn.setAttribute("data-action", "close");
    closeBtn.setAttribute("aria-label", "Hide controller (Press V to toggle)");
    closeBtn.textContent = "×";

    this.controlsGroup.appendChild(rewindBtn);
    this.controlsGroup.appendChild(slowerBtn);
    this.controlsGroup.appendChild(fasterBtn);
    this.controlsGroup.appendChild(advanceBtn);
    this.controlsGroup.appendChild(closeBtn);

    // Speed badge first, then controls group
    this.pillElem.appendChild(this.rateBadge);
    this.pillElem.appendChild(this.controlsGroup);

    this.shadow.appendChild(style);
    this.shadow.appendChild(this.pillElem);

    this.setupInteractions();
  }

  private setupInteractions(): void {
    // 1. Button click actions and bubbling prevention
    this.pillElem.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      const target = e.target as HTMLElement | null;
      if (!target || !this.controller) return;

      const action = target.getAttribute("data-action");
      if (!action || action === "drag") return;

      e.preventDefault();

      switch (action) {
        case "rewind":
          this.controller.seekBy(-10);
          break;
        case "slower":
          this.controller.decreaseRate();
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

    this.pillElem.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation();
    });

    // 2. Double-click on speed indicator resets speed to 1.00
    this.rateBadge.addEventListener("dblclick", (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      this.controller?.resetRate();
    });

    // 3. Mouse wheel speed adjustment with hover dwell gate & trackpad filtering
    const HOVER_DWELL_MS = 300;
    const TOUCHPAD_THRESHOLD = 50;

    this.pillElem.addEventListener("mouseenter", () => {
      this.hoverStart = performance.now();
    });

    this.pillElem.addEventListener("mouseleave", () => {
      this.hoverStart = 0;
    });

    this.pillElem.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        // Ignore pinch zoom
        if (e.ctrlKey) return;

        // Reject wheel events before hover dwell threshold is reached
        if (performance.now() - this.hoverStart < HOVER_DWELL_MS) return;

        // Filter out tiny trackpad scrolling
        if (
          e.deltaMode === WheelEvent.DOM_DELTA_PIXEL &&
          Math.abs(e.deltaY) < TOUCHPAD_THRESHOLD
        ) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (!this.controller) return;

        if (e.deltaY < 0) {
          this.controller.increaseRate();
        } else {
          this.controller.decreaseRate();
        }
      },
      { passive: false }
    );
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
