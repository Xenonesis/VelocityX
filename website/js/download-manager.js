export class DownloadManager {
  constructor(options = {}) {
    this.version = options.version || "1.0.0";
  }

  detectPlatform(customUa) {
    const ua = customUa || (typeof navigator !== "undefined" ? navigator.userAgent : "");
    if (ua.includes("Firefox")) return "firefox";
    if (ua.includes("Edg/")) return "edge";
    return "chrome";
  }

  getDownloadMeta(platform) {
    const isFirefox = platform === "firefox";
    const filename = isFirefox
      ? `velocityx-firefox-v${this.version}.zip`
      : `velocityx-chrome-v${this.version}.zip`;

    const titles = {
      chrome: "Download for Chrome",
      edge: "Download for Edge",
      brave: "Download for Brave",
      firefox: "Download for Firefox",
    };

    return {
      platform,
      title: titles[platform] || `Download for ${platform.toUpperCase()}`,
      filename,
      url: `assets/downloads/${filename}`,
      size: "32 KB",
      version: `v${this.version}`,
    };
  }

  triggerDownload(meta) {
    if (typeof document === "undefined") return;
    const a = document.createElement("a");
    a.href = meta.url;
    a.download = meta.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  setup(elements, onDownloadRequested) {
    if (!elements || !elements.primaryBtn) return;

    const detected = this.detectPlatform();
    const meta = this.getDownloadMeta(detected);

    if (elements.primaryText) {
      elements.primaryText.textContent = `${meta.title} (${meta.version})`;
    }

    elements.primaryBtn.addEventListener("click", () => {
      this.triggerDownload(meta);
      if (onDownloadRequested) onDownloadRequested(meta);
    });

    if (elements.dropdownItems) {
      elements.dropdownItems.forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const targetPlatform = item.dataset.platform || detected;
          const targetMeta = this.getDownloadMeta(targetPlatform);
          this.triggerDownload(targetMeta);
          if (onDownloadRequested) onDownloadRequested(targetMeta);
        });
      });
    }
  }
}
