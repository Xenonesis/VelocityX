import { HeroSimulator } from "./js/hero-simulator.js";
import { DownloadManager } from "./js/download-manager.js";
import { InstallModal } from "./js/install-modal.js";

/**
 * VelocityX Application Entry Point
 * Orchestrates DownloadManager, InstallModal, and HeroSimulator.
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Download Manager & Dropdown Routing
  const downloadManager = new DownloadManager({ version: "1.0.0" });
  const primaryBtn = document.getElementById("primary-download-btn");
  const primaryText = document.getElementById("primary-download-text");
  const downloadDropdown = document.getElementById("download-dropdown");
  const dropdownToggle = document.getElementById("download-dropdown-toggle");
  const dropdownItems = downloadDropdown?.querySelectorAll(".dropdown-item");

  downloadManager.setup(
    {
      primaryBtn,
      primaryText,
      dropdownItems,
    },
    (meta) => {
      console.log(`[VelocityX] Download initiated: ${meta.filename} (${meta.platform})`);
    }
  );

  if (dropdownToggle && downloadDropdown) {
    dropdownToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = downloadDropdown.classList.toggle("open");
      dropdownToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (e) => {
      if (!downloadDropdown.contains(e.target) && e.target !== dropdownToggle) {
        downloadDropdown.classList.remove("open");
        dropdownToggle.setAttribute("aria-expanded", "false");
      }
    });

    dropdownItems?.forEach((item) => {
      item.addEventListener("click", () => {
        downloadDropdown.classList.remove("open");
        dropdownToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 2. Installation Modal Controller
  const modalElem = document.getElementById("install-modal");
  const installModal = new InstallModal(modalElem);

  const openInstallGuideBtn = document.getElementById("open-install-guide-btn");
  if (openInstallGuideBtn) {
    openInstallGuideBtn.addEventListener("click", () => {
      const detected = downloadManager.detectPlatform();
      installModal.open(detected === "firefox" ? "firefox" : "chrome");
    });
  }

  const headerInstallBtn = document.getElementById("header-install-btn");
  if (headerInstallBtn) {
    headerInstallBtn.addEventListener("click", () => {
      const detected = downloadManager.detectPlatform();
      installModal.open(detected === "firefox" ? "firefox" : "chrome");
    });
  }

  document.querySelectorAll(".open-install-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const detected = downloadManager.detectPlatform();
      installModal.open(detected === "firefox" ? "firefox" : "chrome");
    });
  });

  // 3. Hero Video Simulator Engine
  const video = document.getElementById("demo-video");
  const videoViewport = document.getElementById("video-viewport");
  const rateDisplay = document.getElementById("sim-rate-display");
  const toastElem = document.getElementById("sim-toast");
  const toastText = document.getElementById("sim-toast-text");
  const toastIcon = document.getElementById("sim-toast-icon");
  const simController = document.getElementById("sim-controller");
  const simClock = document.getElementById("sim-clock");
  const overlayPlayBtn = document.getElementById("overlay-play-btn");

  const simulator = new HeroSimulator(video, {
    speedStep: 0.1,
    preferredSpeed: 1.8,
    defaultSpeed: 1.0,
    rateDisplay,
    toastElem,
    toastText,
    toastIcon,
  });
  // Preset dials synchronization
  const presetButtons = document.querySelectorAll(".preset-dial-btn");
  const audioStateDisplay = document.getElementById("sim-audio-state");
  function syncPresetHighlight(rate) {
    presetButtons.forEach((btn) => {
      const btnRate = parseFloat(btn.dataset.rate || "0");
      if (Math.abs(btnRate - rate) < 0.05) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    if (audioStateDisplay) {
      audioStateDisplay.textContent = `RMS: ${rate.toFixed(2)}×`;
    }
  }

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const r = parseFloat(btn.dataset.rate || "1.0");
      simulator.setRate(r);
      syncPresetHighlight(r);
    });
  });

  // Hook simulator rate update to sync preset highlight
  const originalSetRate = simulator.setRate.bind(simulator);
  simulator.setRate = function(rate) {
    originalSetRate(rate);
    syncPresetHighlight(this.currentRate);
  };

  // Mute / Unmute audio button
  const muteBtn = document.getElementById("sim-mute-btn");
  if (video && muteBtn) {
    muteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      if (video.muted) {
        muteBtn.textContent = "🔊 UNMUTE";
        muteBtn.classList.remove("unmuted");
        simulator.showToast("Muted", "🔇");
      } else {
        muteBtn.textContent = "🔈 MUTED";
        muteBtn.classList.add("unmuted");
        simulator.showToast("Audio On", "🔊");
        if (video.paused) video.play().catch(() => {});
      }
    });
  }

  // Animated RMS Equalizer Waveform Canvas
  const audioCanvas = document.getElementById("sim-audio-bars");
  if (audioCanvas) {
    const ctx = audioCanvas.getContext("2d");
    const barCount = 12;
    function drawAudioBars() {
      if (!ctx) return;
      ctx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
      const isPlaying = video && !video.paused;
      const rate = simulator ? simulator.currentRate : 1.0;
      const t = Date.now() * 0.006 * rate;

      for (let i = 0; i < barCount; i++) {
        const x = i * 5;
        let height = isPlaying
          ? Math.max(2, Math.floor(Math.abs(Math.sin(t + i * 0.7)) * 14 + 1))
          : 2;
        ctx.fillStyle = i > 9 ? "#ff9e1b" : "#38e1ff";
        ctx.fillRect(x, audioCanvas.height - height, 3, height);
      }
      requestAnimationFrame(drawAudioBars);
    }
    requestAnimationFrame(drawAudioBars);
  }


  // Wire controller pill buttons
  document.getElementById("sim-slower-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    simulator.adjustRate(-0.1);
    flashKeycode("KeyS");
  });

  document.getElementById("sim-faster-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    simulator.adjustRate(0.1);
    flashKeycode("KeyD");
  });

  rateDisplay?.addEventListener("click", (e) => {
    e.stopPropagation();
    simulator.resetRate();
    flashKeycode("KeyR");
  });

  document.getElementById("sim-rewind-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (video) video.currentTime = Math.max(0, video.currentTime - 10);
    simulator.showToast("Rewind 10s", "⏪");
    flashKeycode("KeyZ");
  });

  document.getElementById("sim-forward-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (video) video.currentTime += 10;
    simulator.showToast("Forward 10s", "⏩");
    flashKeycode("KeyX");
  });

  document.getElementById("sim-close-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (simController) {
      simController.classList.toggle("hidden");
    }
  });

  // Video play/pause toggle handling
  function togglePlayback() {
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  video?.addEventListener("play", () => {
    videoViewport?.classList.remove("paused");
  });

  video?.addEventListener("pause", () => {
    videoViewport?.classList.add("paused");
  });

  videoViewport?.addEventListener("click", (e) => {
    if (e.target.closest("#sim-controller") || e.target.closest("#sim-toast")) {
      return;
    }
    togglePlayback();
  });

  overlayPlayBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlayback();
  });

  // Timecode telemetry readout
  if (video && simClock) {
    video.addEventListener("timeupdate", () => {
      const cur = video.currentTime || 0;
      const mins = Math.floor(cur / 60);
      const secs = Math.floor(cur % 60);
      const centis = Math.floor((cur % 1) * 100);
      simClock.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
    });
  }

  // Visual keycap flashing helper
  function flashKeycode(code) {
    const card = document.querySelector(`.keycap-card[data-code="${code}"]`);
    if (card) {
      card.classList.add("active-press");
      setTimeout(() => card.classList.remove("active-press"), 180);
    }
    const mini = document.querySelector(`.mini-kbd[data-trigger="${code}"]`);
    if (mini) {
      mini.classList.add("active-pulse");
      setTimeout(() => mini.classList.remove("active-pulse"), 180);
    }
  }

  // Keyboard shortcut listener
  document.addEventListener("keydown", (e) => {
    const targetTag = (e.target?.tagName || "").toLowerCase();
    if (targetTag === "input" || targetTag === "textarea" || e.target?.isContentEditable) {
      return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      togglePlayback();
      simulator.showToast(video?.paused ? "Paused" : "Playing", "⏯️");
      return;
    }

    if (e.code === "KeyV") {
      e.preventDefault();
      simController?.classList.toggle("hidden");
      flashKeycode("KeyV");
      simulator.showToast(
        simController?.classList.contains("hidden") ? "HUD Hidden" : "HUD Visible",
        "👁️"
      );
      return;
    }

    if (e.code === "KeyB") {
      e.preventDefault();
      flashKeycode("KeyB");
      simulator.showToast("Audio Boost: 300%", "🔊");
      return;
    }

    const handled = simulator.handleKey(e);
    if (handled) {
      flashKeycode(e.code);
    }
  });

  // Clickable keyboard reference cards
  document.querySelectorAll(".keycap-card").forEach((card) => {
    card.addEventListener("click", () => {
      const code = card.dataset.code;
      if (!code) return;
      flashKeycode(code);
      if (code === "KeyV") {
        simController?.classList.toggle("hidden");
      } else if (code === "KeyB") {
        simulator.showToast("Audio Boost: 300%", "🔊");
      } else {
        simulator.handleKey({ code, preventDefault: () => {} });
      }
    });
  });

  // Clickable mini kbd pills under simulator
  document.querySelectorAll(".mini-kbd").forEach((pill) => {
    pill.addEventListener("click", () => {
      const code = pill.dataset.trigger;
      if (!code) return;
      flashKeycode(code);
      simulator.handleKey({ code, preventDefault: () => {} });
    });
  });

  // Expose global for automated testing / inspection
  window.velocityX = {
    downloadManager,
    installModal,
    simulator,
  };

  console.log("[VelocityX] Landing page engine successfully initialized.");
});
