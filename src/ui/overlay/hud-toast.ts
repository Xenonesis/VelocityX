const TOAST_STYLE = `
:host {
  all: initial !important;
  position: absolute !important;
  top: 12% !important;
  left: 50% !important;
  transform: translate(-50%, -10px) !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  display: block !important;
  visibility: hidden !important;
  opacity: 0 !important;
  transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.18s !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
}
:host(.visible) {
  visibility: visible !important;
  opacity: 1 !important;
  transform: translate(-50%, 0) !important;
}
.toast-badge {
  background: rgba(10, 12, 16, 0.88) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  color: #f8fafc !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  line-height: 1.4 !important;
  padding: 8px 18px !important;
  border-radius: 9999px !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.14) !important;
  letter-spacing: 0.2px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  white-space: nowrap !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}
.toast-icon {
  font-size: 14px !important;
  color: #38e1ff !important;
  display: inline-block !important;
  text-shadow: 0 0 8px rgba(56, 225, 255, 0.4) !important;
}
`;

export class HUDToastElement extends HTMLElement {
  private readonly shadow: ShadowRoot;
  private readonly badge: HTMLDivElement;
  private readonly iconElem: HTMLSpanElement;
  private readonly textElem: HTMLSpanElement;
  private hideTimer: number | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = TOAST_STYLE;

    this.badge = document.createElement("div");
    this.badge.className = "toast-badge";

    this.iconElem = document.createElement("span");
    this.iconElem.className = "toast-icon";

    this.textElem = document.createElement("span");

    this.badge.appendChild(this.iconElem);
    this.badge.appendChild(this.textElem);

    this.shadow.appendChild(style);
    this.shadow.appendChild(this.badge);
  }

  show(text: string, icon = "⚡", durationMs = 900): void {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.iconElem.textContent = icon;
    this.textElem.textContent = text;
    this.classList.add("visible");

    this.hideTimer = window.setTimeout(() => {
      this.classList.remove("visible");
      this.hideTimer = null;
    }, durationMs);
  }

  destroy(): void {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.remove();
  }
}

export function registerHUDToast(): void {
  const registry = window.customElements;
  if (registry && !registry.get("velocity-hud-toast")) {
    registry.define("velocity-hud-toast", HUDToastElement);
  }
}
