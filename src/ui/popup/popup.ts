import { formatRate } from "../../core/constants";
import { SettingsV1 } from "../../storage/schema";
import { DEFAULT_SETTINGS } from "../../storage/defaults";
import { migrateSettings } from "../../storage/migrations";

const SETTINGS_KEY = "velocitySettings";

let currentSpeed = 1.0;
let activeTabId: number | null = null;
let currentSettings: SettingsV1 = DEFAULT_SETTINGS;

async function initPopup() {
  await loadSettings();
  setupEventListeners();
  await queryTabMediaState();
}

async function loadSettings() {
  try {
    const data = await chrome.storage.sync.get(SETTINGS_KEY);
    currentSettings = migrateSettings(data[SETTINGS_KEY]);
  } catch {
    currentSettings = migrateSettings(null);
  }

  const rememberToggle = document.getElementById("remember-speed-toggle") as HTMLInputElement | null;
  if (rememberToggle) {
    rememberToggle.checked = currentSettings.rememberPlaybackSpeed;
  }

  const overlayToggle = document.getElementById("overlay-enabled-toggle") as HTMLInputElement | null;
  if (overlayToggle) {
    overlayToggle.checked = currentSettings.overlay.enabled;
  }
}

async function queryTabMediaState() {
  const statusBadge = document.getElementById("media-status-badge");
  const statusText = document.getElementById("status-text");

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0 || !tabs[0].id) {
      if (statusText) statusText.textContent = "No active tab detected";
      return;
    }

    activeTabId = tabs[0].id;

    const response = await chrome.tabs.sendMessage(activeTabId, { type: "GET_MEDIA_STATUS" });
    if (response && response.hasMedia) {
      if (statusBadge) statusBadge.classList.add("active");
      if (statusText) {
        statusText.textContent = `${response.mediaCount} active media element(s)`;
      }
      updateSpeedDisplay(response.activeRate);
    } else {
      if (statusBadge) statusBadge.classList.remove("active");
      if (statusText) statusText.textContent = "No media detected on page";
      updateSpeedDisplay(currentSettings.defaultSpeed);
    }
  } catch {
    if (statusBadge) statusBadge.classList.remove("active");
    if (statusText) statusText.textContent = "No media detected on page";
    updateSpeedDisplay(currentSettings.defaultSpeed);
  }
}

function updateSpeedDisplay(rate: number) {
  currentSpeed = rate;
  const display = document.getElementById("speed-display");
  if (display) {
    display.textContent = formatRate(rate);
  }

  // Highlight matching preset button
  const buttons = document.querySelectorAll<HTMLButtonElement>(".preset-btn");
  buttons.forEach((btn) => {
    const speed = parseFloat(btn.dataset.speed || "0");
    if (Math.abs(speed - rate) < 0.01) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

async function sendActionToTab(action: unknown) {
  if (!activeTabId) return;
  try {
    await chrome.tabs.sendMessage(activeTabId, {
      type: "EXECUTE_ACTION",
      action,
    });
  } catch {
    // Safe fallback if content script not loaded
  }
}

function setupEventListeners() {
  document.getElementById("open-settings-btn")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage?.();
  });

  document.getElementById("slower-btn")?.addEventListener("click", async () => {
    const nextSpeed = Math.max(0.07, currentSpeed - currentSettings.speedStep);
    updateSpeedDisplay(nextSpeed);
    await sendActionToTab({ type: "speed.decrease", step: currentSettings.speedStep });
  });

  document.getElementById("faster-btn")?.addEventListener("click", async () => {
    const nextSpeed = Math.min(16.0, currentSpeed + currentSettings.speedStep);
    updateSpeedDisplay(nextSpeed);
    await sendActionToTab({ type: "speed.increase", step: currentSettings.speedStep });
  });

  const presetButtons = document.querySelectorAll<HTMLButtonElement>(".preset-btn[data-speed]");
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const speed = parseFloat(btn.dataset.speed || "1.0");
      updateSpeedDisplay(speed);
      await sendActionToTab({ type: "speed.set", value: speed });
    });
  });

  const boostButtons = document.querySelectorAll<HTMLButtonElement>(".boost-btn[data-boost]");
  const boostDisplay = document.getElementById("boost-display");
  boostButtons.forEach((btn) => {
    const boost = parseFloat(btn.dataset.boost || "1.0");
    if (Math.abs(boost - 1.0) < 0.01) {
      btn.classList.add("active");
    }
    btn.addEventListener("click", async () => {
      const bVal = parseFloat(btn.dataset.boost || "1.0");
      if (boostDisplay) {
        boostDisplay.textContent = `${Math.round(bVal * 100)}%`;
      }
      boostButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      await sendActionToTab({ type: "audio.boost.set", value: bVal });
    });
  });

  document.getElementById("remember-speed-toggle")?.addEventListener("change", async (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    currentSettings.rememberPlaybackSpeed = checked;
    await saveSettings();
  });

  document.getElementById("overlay-enabled-toggle")?.addEventListener("change", async (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    currentSettings.overlay.enabled = checked;
    await saveSettings();
  });

  document.getElementById("silence-skip-toggle")?.addEventListener("change", async (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    await sendActionToTab({ type: "silence.skip.toggle", enabled: checked });
  });
}

async function saveSettings() {
  try {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: currentSettings });
  } catch {
    await chrome.storage.local.set({ [SETTINGS_KEY]: currentSettings });
  }
}

document.addEventListener("DOMContentLoaded", initPopup);
