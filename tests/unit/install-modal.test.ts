import { describe, it, expect, beforeEach } from "vitest";
// @ts-ignore
import { InstallModal } from "../../website/js/install-modal.js";

interface ModalInstance {
  open: (initialTab?: string) => void;
  close: () => void;
  switchTab: (tabId: string) => void;
  copyText: (text: string, triggerBtn?: HTMLElement) => Promise<boolean>;
}

describe("InstallModal Component", () => {
  let modalElem: HTMLElement;
  let modal: ModalInstance;

  beforeEach(() => {
    modalElem = document.createElement("div");
    modalElem.className = "install-modal-backdrop";
    modalElem.innerHTML = `
      <div class="modal-dialog">
        <button class="close-btn"></button>
        <div class="tab-btn" data-target="chrome">Chrome</div>
        <div class="tab-btn" data-target="firefox">Firefox</div>
        <div class="tab-pane" id="tab-chrome"></div>
        <div class="tab-pane" id="tab-firefox" style="display:none"></div>
      </div>
    `;
    document.body.appendChild(modalElem);
    modal = new InstallModal(modalElem);
  });

  it("opens and closes cleanly by toggling visible class", () => {
    modal.open("chrome");
    expect(modalElem.classList.contains("visible")).toBe(true);

    modal.close();
    expect(modalElem.classList.contains("visible")).toBe(false);
  });

  it("switches tabs between chrome and firefox", () => {
    modal.switchTab("firefox");
    const chromePane = modalElem.querySelector("#tab-chrome") as HTMLElement;
    const firefoxPane = modalElem.querySelector("#tab-firefox") as HTMLElement;

    expect(firefoxPane.style.display).not.toBe("none");
    expect(chromePane.style.display).toBe("none");
  });
});
