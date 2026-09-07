import { SettingsV1, SiteRule } from "../../storage/schema";
import { DEFAULT_SETTINGS } from "../../storage/defaults";
import { migrateSettings } from "../../storage/migrations";
import { DEFAULT_SHORTCUTS, ShortcutBinding } from "../../core/shortcut-manager";

const SETTINGS_KEY = "velocitySettings";

let settings: SettingsV1 = structuredClone(DEFAULT_SETTINGS);
let toastTimer: number | null = null;

async function initOptions() {
  await loadSettings();
  setupNavigation();
  populateForm();
  renderShortcuts();
  renderSiteRules();
  setupEventListeners();
}

async function loadSettings() {
  try {
    const data = await chrome.storage.sync.get(SETTINGS_KEY);
    settings = migrateSettings(data[SETTINGS_KEY]);
  } catch {
    settings = migrateSettings(null);
  }
}

function setupNavigation() {
  const navButtons = document.querySelectorAll<HTMLButtonElement>(".nav-item");
  const panels = document.querySelectorAll<HTMLElement>(".tab-panel");

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;
      if (!targetTab) return;

      navButtons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(`panel-${targetTab}`);
      targetPanel?.classList.add("active");
    });
  });
}

function populateForm() {
  // General
  setCheck("ext-enabled", settings.enabled);
  setNum("default-speed", settings.defaultSpeed);
  setNum("speed-step", settings.speedStep);
  setNum("preferred-speed", settings.preferredSpeed);
  setCheck("remember-speed", settings.rememberPlaybackSpeed);
  setNum("rewind-sec", settings.rewindSeconds);
  setNum("advance-sec", settings.advanceSeconds);

  // Controller
  setCheck("overlay-enabled", settings.overlay.enabled);
  const opacityRange = document.getElementById("overlay-opacity") as HTMLInputElement | null;
  if (opacityRange) {
    opacityRange.value = String(settings.overlay.opacity);
    updateOpacityLabel(settings.overlay.opacity);
  }
  const cssArea = document.getElementById("custom-css") as HTMLTextAreaElement | null;
  if (cssArea) {
    cssArea.value = settings.overlay.customCss;
  }

  // Advanced
  setCheck("fight-resets", settings.compatibility.fightAutomaticRateReset);
}

function renderShortcuts() {
  const tbody = document.getElementById("shortcuts-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const actionLabels: Record<string, string> = {
    "speed.decrease": "Decrease speed",
    "speed.increase": "Increase speed",
    "speed.reset": "Reset speed",
    "seek.rewind": "Rewind",
    "seek.advance": "Forward",
    "speed.preferred.toggle": "Preferred speed toggle",
    "overlay.toggle": "Toggle controller visibility",
    "marker.set": "Set video marker",
    "marker.jump": "Jump to video marker",
  };

  settings.shortcuts.forEach((binding, index) => {
    const tr = document.createElement("tr");

    // Action name
    const tdAction = document.createElement("td");
    tdAction.textContent = actionLabels[binding.id] || binding.id;

    // Shortcut keys representation
    const tdKeys = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "key-badge";
    badge.textContent = formatShortcutBadge(binding);
    tdKeys.appendChild(badge);

    // Enabled checkbox
    const tdStatus = document.createElement("td");
    const label = document.createElement("label");
    label.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = binding.enabled;
    input.addEventListener("change", async () => {
      settings.shortcuts[index].enabled = input.checked;
      await saveSettings();
    });
    const slider = document.createElement("span");
    slider.className = "slider";
    label.appendChild(input);
    label.appendChild(slider);
    tdStatus.appendChild(label);

    tr.appendChild(tdAction);
    tr.appendChild(tdKeys);
    tr.appendChild(tdStatus);
    tbody.appendChild(tr);
  });
}

function formatShortcutBadge(binding: ShortcutBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.alt) parts.push("Alt");
  if (binding.shift) parts.push("Shift");
  if (binding.meta) parts.push("Cmd");

  const keyDisplay = binding.code.replace(/^Key/, "").replace(/^Digit/, "");
  parts.push(keyDisplay);
  return parts.join(" + ");
}

function renderSiteRules() {
  const tbody = document.getElementById("rules-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (settings.siteRules.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.style.textAlign = "center";
    td.style.color = "#64748b";
    td.textContent = "No per-site rules configured. Default settings apply everywhere.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  settings.siteRules.forEach((rule, index) => {
    const tr = document.createElement("tr");

    const tdDomain = document.createElement("td");
    tdDomain.textContent = rule.match;

    const tdSpeed = document.createElement("td");
    tdSpeed.textContent = rule.defaultSpeed ? `${rule.defaultSpeed}×` : "Default";

    const tdStatus = document.createElement("td");
    tdStatus.textContent = rule.enabled ? "Active" : "Disabled";
    tdStatus.style.color = rule.enabled ? "#10b981" : "#ef4444";

    const tdAction = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.className = "btn secondary";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", async () => {
      settings.siteRules.splice(index, 1);
      renderSiteRules();
      await saveSettings();
    });
    tdAction.appendChild(delBtn);

    tr.appendChild(tdDomain);
    tr.appendChild(tdSpeed);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  });
}

function setupEventListeners() {
  // General Inputs
  bindCheck("ext-enabled", (val) => (settings.enabled = val));
  bindNum("default-speed", (val) => (settings.defaultSpeed = val));
  bindNum("speed-step", (val) => (settings.speedStep = val));
  bindNum("preferred-speed", (val) => (settings.preferredSpeed = val));
  bindCheck("remember-speed", (val) => (settings.rememberPlaybackSpeed = val));
  bindNum("rewind-sec", (val) => (settings.rewindSeconds = val));
  bindNum("advance-sec", (val) => (settings.advanceSeconds = val));

  // Controller
  bindCheck("overlay-enabled", (val) => (settings.overlay.enabled = val));

  const opacityInput = document.getElementById("overlay-opacity") as HTMLInputElement | null;
  opacityInput?.addEventListener("input", async () => {
    const val = parseFloat(opacityInput.value);
    settings.overlay.opacity = val;
    updateOpacityLabel(val);
    await saveSettings();
  });

  document.getElementById("reset-position-btn")?.addEventListener("click", async () => {
    settings.overlay.position = { xRatio: 0.02, yRatio: 0.02 };
    await saveSettings();
  });

  const cssArea = document.getElementById("custom-css") as HTMLTextAreaElement | null;
  cssArea?.addEventListener("change", async () => {
    settings.overlay.customCss = cssArea.value;
    await saveSettings();
  });

  document.getElementById("reset-css-btn")?.addEventListener("click", async () => {
    settings.overlay.customCss = "";
    if (cssArea) cssArea.value = "";
    await saveSettings();
  });

  // Shortcuts Reset
  document.getElementById("reset-shortcuts-btn")?.addEventListener("click", async () => {
    settings.shortcuts = structuredClone(DEFAULT_SHORTCUTS);
    renderShortcuts();
    await saveSettings();
  });

  // Site Rules
  document.getElementById("add-rule-btn")?.addEventListener("click", async () => {
    const domainInput = document.getElementById("new-rule-domain") as HTMLInputElement | null;
    const speedInput = document.getElementById("new-rule-speed") as HTMLInputElement | null;
    const enabledInput = document.getElementById("new-rule-enabled") as HTMLInputElement | null;

    const match = domainInput?.value.trim().toLowerCase();
    if (!match) return;

    const defaultSpeed = speedInput?.value ? parseFloat(speedInput.value) : undefined;
    const enabled = enabledInput?.checked ?? true;

    const newRule: SiteRule = {
      id: `rule_${Date.now()}`,
      match,
      enabled,
      defaultSpeed,
    };

    settings.siteRules.push(newRule);
    if (domainInput) domainInput.value = "";
    if (speedInput) speedInput.value = "";

    renderSiteRules();
    await saveSettings();
  });

  // Advanced
  bindCheck("fight-resets", (val) => (settings.compatibility.fightAutomaticRateReset = val));

  // Export JSON
  document.getElementById("export-settings-btn")?.addEventListener("click", () => {
    const jsonStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "velocity-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import JSON
  const importInput = document.getElementById("import-settings-file") as HTMLInputElement | null;
  importInput?.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      settings = migrateSettings(parsed);
      populateForm();
      renderShortcuts();
      renderSiteRules();
      await saveSettings();
    } catch {
      alert("Invalid settings JSON file.");
    }
  });

  // Factory Reset
  document.getElementById("factory-reset-btn")?.addEventListener("click", async () => {
    if (confirm("Reset all Velocity settings to factory defaults?")) {
      settings = structuredClone(DEFAULT_SETTINGS);
      populateForm();
      renderShortcuts();
      renderSiteRules();
      await saveSettings();
    }
  });
}

function updateOpacityLabel(val: number) {
  const label = document.getElementById("opacity-val");
  if (label) {
    label.textContent = `${Math.round(val * 100)}%`;
  }
}

function setCheck(id: string, val: boolean) {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) el.checked = val;
}

function setNum(id: string, val: number) {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) el.value = String(val);
}

function bindCheck(id: string, setter: (val: boolean) => void) {
  document.getElementById(id)?.addEventListener("change", async (e) => {
    setter((e.target as HTMLInputElement).checked);
    await saveSettings();
  });
}

function bindNum(id: string, setter: (val: number) => void) {
  document.getElementById(id)?.addEventListener("change", async (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (Number.isFinite(val)) {
      setter(val);
      await saveSettings();
    }
  });
}

async function saveSettings() {
  try {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
  } catch {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  }

  showToast();
}

function showToast() {
  const toast = document.getElementById("save-toast");
  if (!toast) return;

  toast.classList.add("visible");
  clearTimeout(toastTimer ?? undefined);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2000);
}

document.addEventListener("DOMContentLoaded", initOptions);
