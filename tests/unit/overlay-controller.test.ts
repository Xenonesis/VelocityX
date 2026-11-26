import { describe, it, expect, vi, beforeEach } from "vitest";
import { VelocityControllerElement } from "@/ui/overlay/velocity-controller";
import { MediaController } from "@/core/media-controller";
import { DragHandler } from "@/ui/overlay/drag-handler";
import { FullscreenObserver } from "@/observers/fullscreen-observer";

describe("Overlay UI & VelocityControllerElement", () => {
  let video: HTMLVideoElement;
  let container: HTMLDivElement;
  let controller: MediaController;

  beforeEach(() => {
    container = document.createElement("div");
    Object.defineProperty(container, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 800, height: 450 }),
      configurable: true,
    });
    document.body.appendChild(container);

    video = document.createElement("video");
    Object.defineProperty(video, "duration", { value: 120, writable: true, configurable: true });
    container.appendChild(video);

    controller = new MediaController(video, 1.0);
  });

  it("instantiates custom element and attaches controller", () => {
    const overlay = new VelocityControllerElement();
    container.appendChild(overlay);

    overlay.attachController(controller, container, { xRatio: 0.05, yRatio: 0.1 });
    expect(overlay.style.left).toBe("40px"); // 0.05 * 800
    expect(overlay.style.top).toBe("45px"); // 0.1 * 450

    overlay.destroy();
  });

  it("updates rate display when controller rate changes", () => {
    const overlay = new VelocityControllerElement();
    container.appendChild(overlay);
    overlay.attachController(controller, container);

    overlay.updateRateDisplay(2.2);
    // @ts-expect-error - testing internal rateBadge textContent
    expect(overlay.rateBadge.textContent).toBe("2.20");

    controller.setRate(2.0);
    overlay.updateRateDisplay(controller.desiredRate);
    // @ts-expect-error - testing internal rateBadge textContent
    expect(overlay.rateBadge.textContent).toBe("2.00");
    overlay.destroy();
  });

  it("renders rate badge on the left followed by controls on the right", () => {
    const overlay = new VelocityControllerElement();
    container.appendChild(overlay);
    overlay.attachController(controller, container);

    // @ts-expect-error - internal pillElem inspection
    const pill = overlay.pillElem as HTMLDivElement;
    expect(pill.id).toBe("controller");
    expect(pill.children.length).toBe(2);

    // Child 0 is rateBadge (.draggable)
    expect(pill.children[0].className).toContain("draggable");
    // Child 1 is controlsGroup (#controls)
    expect(pill.children[1].id).toBe("controls");

    const buttons = pill.children[1].querySelectorAll("button");
    const actions = Array.from(buttons).map((b) => b.getAttribute("data-action"));
    expect(actions).toEqual(["rewind", "slower", "faster", "advance", "close"]);

    overlay.destroy();
  });

  it("resets rate on rateBadge double-click", () => {
    const overlay = new VelocityControllerElement();
    container.appendChild(overlay);
    controller.setRate(2.5);
    overlay.attachController(controller, container);

    expect(controller.desiredRate).toBe(2.5);

    // @ts-expect-error - internal rateBadge
    overlay.rateBadge.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(controller.desiredRate).toBe(1.0);

    overlay.destroy();
  });

  it("adjusts speed on mouse wheel event after hover dwell gate", () => {
    const overlay = new VelocityControllerElement();
    container.appendChild(overlay);
    controller.setRate(1.0);
    overlay.attachController(controller, container);

    // @ts-expect-error - internal pillElem
    const pill = overlay.pillElem as HTMLDivElement;

    // Enter hover
    pill.dispatchEvent(new MouseEvent("mouseenter"));
    // @ts-expect-error - simulate dwell timestamp
    overlay.hoverStart = performance.now() - 400; // > 300ms

    // Wheel up: increases speed
    pill.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: -100,
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        bubbles: true,
        cancelable: true,
      })
    );
    expect(controller.desiredRate).toBe(1.1);

    // Immediate rapid wheel down is throttled to prevent runaway rates
    pill.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: 100,
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        bubbles: true,
        cancelable: true,
      })
    );
    expect(controller.desiredRate).toBe(1.1); // Unchanged due to 120ms cooldown

    // Wheel down after cooldown window expires
    // @ts-expect-error - simulate throttle elapsed
    overlay.lastWheelStep = performance.now() - 200;
    pill.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: 100,
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        bubbles: true,
        cancelable: true,
      })
    );
    expect(controller.desiredRate).toBe(1.0);
    overlay.destroy();
  });

  it("handles overlay visibility toggling", () => {
    const overlay = new VelocityControllerElement();
    container.appendChild(overlay);

    overlay.setVisible(false);
    expect(overlay.getAttribute("data-hidden")).toBe("true");

    overlay.setVisible(true);
    expect(overlay.hasAttribute("data-hidden")).toBe(false);

    overlay.destroy();
  });

  it("persists position to storage on drag end", () => {
    const overlay = new VelocityControllerElement();
    container.appendChild(overlay);
    overlay.attachController(controller, container, { xRatio: 0.1, yRatio: 0.1 });

    const saveSpy = vi.fn();
    window.addEventListener("velocity:storage:save-position", saveSpy);

    // @ts-expect-error - internal pillElem
    const pill = overlay.pillElem as HTMLDivElement;
    pill.dispatchEvent(new MouseEvent("pointerdown", { button: 0, clientX: 40, clientY: 45, bubbles: true, composed: true }));
    pill.dispatchEvent(new MouseEvent("pointermove", { clientX: 240, clientY: 135, bubbles: true, composed: true }));
    pill.dispatchEvent(new MouseEvent("pointerup", { clientX: 240, clientY: 135, bubbles: true, composed: true }));

    expect(saveSpy).toHaveBeenCalledTimes(1);
    const detail = saveSpy.mock.calls[0][0].detail;
    expect(detail.xRatio).toBeCloseTo(0.25);
    expect(detail.yRatio).toBeCloseTo(0.2);
    expect(overlay.style.left).toBe("200px");
    expect(overlay.style.top).toBe("90px");

    window.removeEventListener("velocity:storage:save-position", saveSpy);
    overlay.destroy();
  });

  it("applies a saved position to an existing overlay", () => {
    const overlay = new VelocityControllerElement();
    container.appendChild(overlay);
    overlay.attachController(controller, container, { xRatio: 0.1, yRatio: 0.1 });

    overlay.setPosition({ xRatio: 0.5, yRatio: 0.4 });
    expect(overlay.style.left).toBe("400px");
    expect(overlay.style.top).toBe("180px");

    overlay.destroy();
  });

  it("ends drag when pointerup lands outside the overlay", () => {
    const overlay = new VelocityControllerElement();
    container.appendChild(overlay);
    overlay.attachController(controller, container, { xRatio: 0.1, yRatio: 0.1 });

    const saveSpy = vi.fn();
    window.addEventListener("velocity:storage:save-position", saveSpy);

    // @ts-expect-error - internal pillElem
    const pill = overlay.pillElem as HTMLDivElement;
    pill.dispatchEvent(new MouseEvent("pointerdown", { button: 0, clientX: 40, clientY: 45, bubbles: true, composed: true }));
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 240, clientY: 135, bubbles: true }));
    window.dispatchEvent(new MouseEvent("pointerup", { clientX: 240, clientY: 135, bubbles: true }));

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(pill.classList.contains("dragging")).toBe(false);

    window.removeEventListener("velocity:storage:save-position", saveSpy);
    overlay.destroy();
  });

  it("does not start a drag on a zero-size container", () => {
    const zero = document.createElement("div");
    Object.defineProperty(zero, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 0, height: 0 }),
      configurable: true,
    });

    const overlay = new VelocityControllerElement();
    zero.appendChild(overlay);
    overlay.attachController(controller, zero, { xRatio: 0.1, yRatio: 0.1 });

    const saveSpy = vi.fn();
    window.addEventListener("velocity:storage:save-position", saveSpy);

    // @ts-expect-error - internal pillElem
    const pill = overlay.pillElem as HTMLDivElement;
    pill.dispatchEvent(new MouseEvent("pointerdown", { button: 0, clientX: 10, clientY: 10, bubbles: true, composed: true }));
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 100, clientY: 100, bubbles: true }));
    window.dispatchEvent(new MouseEvent("pointerup", { clientX: 100, clientY: 100, bubbles: true }));

    expect(saveSpy).not.toHaveBeenCalled();
    expect(overlay.style.left).not.toContain("NaN");

    window.removeEventListener("velocity:storage:save-position", saveSpy);
    overlay.destroy();
  });
});

describe("DragHandler", () => {
  it("initializes with bounded normalized coordinates", () => {
    const elem = document.createElement("div");
    const container = document.createElement("div");

    const drag = new DragHandler(elem, () => container, { xRatio: 0.1, yRatio: 0.2 });
    expect(drag.getPosition()).toEqual({ xRatio: 0.1, yRatio: 0.2 });

    // Extreme bounds are clamped to max 0.95
    drag.setPosition({ xRatio: 1.5, yRatio: -0.5 });
    expect(drag.getPosition()).toEqual({ xRatio: 0.95, yRatio: 0 });

    drag.destroy();
  });
});

describe("FullscreenObserver", () => {
  it("triggers callback on document fullscreen events", () => {
    const callback = vi.fn();
    const observer = new FullscreenObserver(callback);

    document.dispatchEvent(new Event("fullscreenchange"));
    expect(callback).toHaveBeenCalledWith(false, null);

    observer.destroy();
    document.dispatchEvent(new Event("fullscreenchange"));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
