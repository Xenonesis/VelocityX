export type TargetBrowser = "chrome" | "firefox" | "safari";

export interface ManifestOptions {
  version?: string;
}

export function generateManifest(target: TargetBrowser, options: ManifestOptions = {}): Record<string, unknown> {
  const version = options.version || "1.0.0";

  const baseManifest: Record<string, unknown> = {
    manifest_version: 3,
    name: "Velocity — Video Speed Controller",
    version,
    description: "Fine-grained playback controls, custom shortcuts, and intelligent speed arbitration for HTML5 video and audio.",
    permissions: ["storage", "contextMenus"],
    icons: {
      "16": "assets/icons/icon-16.png",
      "48": "assets/icons/icon-48.png",
      "128": "assets/icons/icon-128.png",
    },
    action: {
      default_popup: "ui/popup/popup.html",
      default_icon: {
        "16": "assets/icons/icon-16.png",
        "48": "assets/icons/icon-48.png",
        "128": "assets/icons/icon-128.png",
      },
    },
    options_ui: {
      page: "ui/options/options.html",
      open_in_tab: true,
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        all_frames: true,
        match_about_blank: true,
        exclude_matches: [
          "https://hangouts.google.com/*",
          "https://meet.google.com/*",
          "https://teams.microsoft.com/*",
        ],
        js: ["isolated-bridge.js"],
        run_at: "document_start",
        world: "ISOLATED",
      },
      {
        matches: ["<all_urls>"],
        all_frames: true,
        match_about_blank: true,
        exclude_matches: [
          "https://hangouts.google.com/*",
          "https://meet.google.com/*",
          "https://teams.microsoft.com/*",
        ],
        js: ["main-entry.js"],
        run_at: "document_idle",
        world: "MAIN",
      },
    ],
  };

  if (target === "chrome") {
    return {
      ...baseManifest,
      minimum_chrome_version: "111",
      background: {
        service_worker: "background.js",
        type: "module",
      },
    };
  }

  if (target === "firefox") {
    return {
      ...baseManifest,
      browser_specific_settings: {
        gecko: {
          id: "velocityx@xenonesis.github.io",
          strict_min_version: "109.0",
        },
      },
      background: {
        scripts: ["background.js"],
      },
    };
  }

  // Safari
  return {
    ...baseManifest,
    browser_specific_settings: {
      safari: {
        strict_min_version: "15.4",
      },
    },
    background: {
      service_worker: "background.js",
    },
  };
}
