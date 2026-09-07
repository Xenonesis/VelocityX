import { clamp } from "../../utils/clamp";

export interface DragPosition {
  xRatio: number;
  yRatio: number;
}

export interface DragHandlerCallbacks {
  onDragStart?: () => void;
  onDrag?: (pos: DragPosition) => void;
  onDragEnd?: (pos: DragPosition) => void;
}

export class DragHandler {
  private readonly element: HTMLElement;
  private readonly getContainer: () => HTMLElement | null;
  private readonly callbacks: DragHandlerCallbacks;
  private readonly abortController = new AbortController();

  private isDragging = false;
  private startPointerX = 0;
  private startPointerY = 0;
  private startElemX = 0;
  private startElemY = 0;
  private currentPos: DragPosition;

  constructor(
    element: HTMLElement,
    getContainer: () => HTMLElement | null,
    initialPosition: DragPosition = { xRatio: 0.02, yRatio: 0.02 },
    callbacks: DragHandlerCallbacks = {}
  ) {
    this.element = element;
    this.getContainer = getContainer;
    this.currentPos = {
      xRatio: clamp(initialPosition.xRatio, 0, 0.95),
      yRatio: clamp(initialPosition.yRatio, 0, 0.95),
    };
    this.callbacks = callbacks;

    this.bindEvents();
  }

  getPosition(): DragPosition {
    return { ...this.currentPos };
  }

  setPosition(pos: DragPosition): void {
    this.currentPos = {
      xRatio: clamp(pos.xRatio, 0, 0.95),
      yRatio: clamp(pos.yRatio, 0, 0.95),
    };
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.element.addEventListener(
      "pointerdown",
      (e: PointerEvent) => {
        if (e.button !== 0) return;

        // Do not drag if user clicked an interactive control button inside overlay
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName.toLowerCase() === "button" || target.closest("button"))) {
          return;
        }

        const container = this.getContainer();
        if (!container) return;

        this.isDragging = true;
        this.startPointerX = e.clientX;
        this.startPointerY = e.clientY;

        const containerRect = container.getBoundingClientRect();
        const elemRect = this.element.getBoundingClientRect();

        this.startElemX = elemRect.left - containerRect.left;
        this.startElemY = elemRect.top - containerRect.top;

        try {
          this.element.setPointerCapture(e.pointerId);
        } catch {
          // Safe fallback if setPointerCapture is unsupported
        }

        e.preventDefault();
        e.stopPropagation();
        this.callbacks.onDragStart?.();
      },
      { signal }
    );

    this.element.addEventListener(
      "pointermove",
      (e: PointerEvent) => {
        if (!this.isDragging) return;

        const container = this.getContainer();
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const elemRect = this.element.getBoundingClientRect();

        const maxAvailableX = Math.max(containerRect.width - elemRect.width, 1);
        const maxAvailableY = Math.max(containerRect.height - elemRect.height, 1);

        const deltaX = e.clientX - this.startPointerX;
        const deltaY = e.clientY - this.startPointerY;

        const rawNextX = this.startElemX + deltaX;
        const rawNextY = this.startElemY + deltaY;

        const clampedX = clamp(rawNextX, 0, maxAvailableX);
        const clampedY = clamp(rawNextY, 0, maxAvailableY);

        this.currentPos = {
          xRatio: clamp(clampedX / containerRect.width, 0, 0.95),
          yRatio: clamp(clampedY / containerRect.height, 0, 0.95),
        };

        this.callbacks.onDrag?.(this.currentPos);
      },
      { signal }
    );

    const onPointerEnd = (e: PointerEvent) => {
      if (!this.isDragging) return;
      this.isDragging = false;

      try {
        if (this.element.hasPointerCapture(e.pointerId)) {
          this.element.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }

      this.callbacks.onDragEnd?.(this.currentPos);
    };

    this.element.addEventListener("pointerup", onPointerEnd, { signal });
    this.element.addEventListener("pointercancel", onPointerEnd, { signal });
  }

  destroy(): void {
    this.abortController.abort();
    this.isDragging = false;
  }
}
