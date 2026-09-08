export class HeroSimulator {
  constructor(mediaElement, options = {}) {
    this.media = mediaElement;
    this.speedStep = options.speedStep || 0.1;
    this.preferredSpeed = options.preferredSpeed || 1.8;
    this.currentRate = options.defaultSpeed || 1.0;
    this.previousRate = null;
    this.silenceSkipEnabled = false;
    this.toastTimer = null;

    this.rateDisplay = options.rateDisplay || null;
    this.toastElem = options.toastElem || null;
    this.toastText = options.toastText || null;
    this.toastIcon = options.toastIcon || null;
  }

  setRate(rate) {
    const clamped = Math.min(16.0, Math.max(0.07, Math.round(rate * 100) / 100));
    this.currentRate = clamped;
    if (this.media) {
      this.media.playbackRate = clamped;
    }
    this.updateDisplay();
    this.showToast(`${clamped.toFixed(2)}×`, "⚡");
  }

  adjustRate(delta) {
    this.setRate(this.currentRate + delta);
  }

  resetRate() {
    if (Math.abs(this.currentRate - 1.0) > 0.01) {
      this.previousRate = this.currentRate;
      this.setRate(1.0);
      this.showToast("Reset to 1.00×", "↺");
    } else if (this.previousRate !== null) {
      const restore = this.previousRate;
      this.previousRate = null;
      this.setRate(restore);
      this.showToast(`Restored ${restore.toFixed(2)}×`, "↺");
    } else {
      this.setRate(1.0);
    }
  }

  togglePreferred() {
    if (Math.abs(this.currentRate - this.preferredSpeed) > 0.01) {
      this.previousRate = this.currentRate;
      this.setRate(this.preferredSpeed);
    } else if (this.previousRate !== null) {
      this.setRate(this.previousRate);
    }
  }

  toggleSilenceSkip() {
    this.silenceSkipEnabled = !this.silenceSkipEnabled;
    this.showToast(
      this.silenceSkipEnabled ? "Silence Skip On (3.0×)" : "Silence Skip Off",
      "⏩"
    );
    return this.silenceSkipEnabled;
  }

  updateDisplay() {
    if (this.rateDisplay) {
      this.rateDisplay.textContent = `${this.currentRate.toFixed(2)}×`;
    }
  }

  showToast(text, icon = "⚡") {
    if (!this.toastElem) return;
    if (this.toastText) this.toastText.textContent = text;
    if (this.toastIcon) this.toastIcon.textContent = icon;

    this.toastElem.classList.add("visible");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastElem.classList.remove("visible");
    }, 1200);
  }

  handleKey(e) {
    if (!e || !e.code) return false;

    switch (e.code) {
      case "KeyD":
        e.preventDefault?.();
        this.adjustRate(this.speedStep);
        return true;
      case "KeyS":
        e.preventDefault?.();
        this.adjustRate(-this.speedStep);
        return true;
      case "KeyR":
        e.preventDefault?.();
        this.resetRate();
        return true;
      case "KeyG":
        e.preventDefault?.();
        this.togglePreferred();
        return true;
      case "KeyK":
        e.preventDefault?.();
        this.toggleSilenceSkip();
        return true;
      case "KeyZ":
        e.preventDefault?.();
        if (this.media) this.media.currentTime = Math.max(0, this.media.currentTime - 10);
        this.showToast("Rewind 10s", "⏪");
        return true;
      case "KeyX":
        e.preventDefault?.();
        if (this.media) this.media.currentTime += 10;
        this.showToast("Forward 10s", "⏩");
        return true;
      case "KeyP":
        e.preventDefault?.();
        if (this.media && document.pictureInPictureEnabled) {
          if (document.pictureInPictureElement === this.media) {
            document.exitPictureInPicture().catch(() => {});
          } else {
            this.media.requestPictureInPicture().catch(() => {});
          }
          this.showToast("Picture-in-Picture", "🖼️");
        }
        return true;
      default:
        return false;
    }
  }
}
