export class InstallModal {
  constructor(modalElement) {
    this.modal = modalElement;
    this.isOpen = false;
    this.activeTab = "chrome";
    this.init();
  }

  init() {
    if (!this.modal) return;

    this.modal.querySelector(".close-btn")?.addEventListener("click", () => this.close());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.close();
    });

    const tabButtons = this.modal.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        if (target) this.switchTab(target);
      });
    });

    const copyButtons = this.modal.querySelectorAll(".copy-url-btn");
    copyButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const text = btn.dataset.copy || "";
        await this.copyText(text, btn);
      });
    });
  }

  open(initialTab = "chrome") {
    if (!this.modal) return;
    this.isOpen = true;
    this.modal.classList.add("visible");
    this.switchTab(initialTab);
    document.body.style.overflow = "hidden";
  }

  close() {
    if (!this.modal) return;
    this.isOpen = false;
    this.modal.classList.remove("visible");
    document.body.style.overflow = "";
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    const tabButtons = this.modal.querySelectorAll(".tab-btn");
    const tabPanes = this.modal.querySelectorAll(".tab-pane");

    tabButtons.forEach((b) => {
      b.classList.toggle("active", b.dataset.target === tabId);
    });

    tabPanes.forEach((p) => {
      p.style.display = p.id === `tab-${tabId}` ? "block" : "none";
    });
  }

  async copyText(text, triggerBtn) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      if (triggerBtn) {
        const original = triggerBtn.textContent;
        triggerBtn.textContent = "Copied!";
        setTimeout(() => {
          triggerBtn.textContent = original;
        }, 1500);
      }
      return true;
    } catch {
      return false;
    }
  }
}
