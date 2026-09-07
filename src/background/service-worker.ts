// Velocity - Background Service Worker

function setupContextMenus(): void {
  if (!chrome.contextMenus) return;

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "velocity_root",
      title: "VelocityX Controls",
      contexts: ["all", "video", "audio"],
    });

    const speedOptions = [
      { id: "velocity_speed_05", title: "0.50x", speed: 0.5 },
      { id: "velocity_speed_10", title: "1.00x (Normal)", speed: 1.0 },
      { id: "velocity_speed_125", title: "1.25x", speed: 1.25 },
      { id: "velocity_speed_15", title: "1.50x", speed: 1.5 },
      { id: "velocity_speed_175", title: "1.75x", speed: 1.75 },
      { id: "velocity_speed_20", title: "2.00x", speed: 2.0 },
      { id: "velocity_speed_30", title: "3.00x", speed: 3.0 },
    ];

    for (const opt of speedOptions) {
      chrome.contextMenus.create({
        id: opt.id,
        parentId: "velocity_root",
        title: opt.title,
        contexts: ["all", "video", "audio"],
      });
    }

    chrome.contextMenus.create({
      id: "velocity_sep_1",
      parentId: "velocity_root",
      type: "separator",
      contexts: ["all", "video", "audio"],
    });

    chrome.contextMenus.create({
      id: "velocity_reset",
      parentId: "velocity_root",
      title: "Reset Speed (R)",
      contexts: ["all", "video", "audio"],
    });

    chrome.contextMenus.create({
      id: "velocity_pip",
      parentId: "velocity_root",
      title: "Picture-in-Picture (P)",
      contexts: ["all", "video", "audio"],
    });

    chrome.contextMenus.create({
      id: "velocity_boost",
      parentId: "velocity_root",
      title: "Audio Boost (+50%)",
      contexts: ["all", "video", "audio"],
    });

    chrome.contextMenus.create({
      id: "velocity_silence",
      parentId: "velocity_root",
      title: "Toggle Silence Skip (K)",
      contexts: ["all", "video", "audio"],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
});

chrome.runtime.onStartup?.addListener(() => {
  setupContextMenus();
});

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  const actionMap: Record<string, unknown> = {
    velocity_speed_05: { type: "speed.set", value: 0.5 },
    velocity_speed_10: { type: "speed.set", value: 1.0 },
    velocity_speed_125: { type: "speed.set", value: 1.25 },
    velocity_speed_15: { type: "speed.set", value: 1.5 },
    velocity_speed_175: { type: "speed.set", value: 1.75 },
    velocity_speed_20: { type: "speed.set", value: 2.0 },
    velocity_speed_30: { type: "speed.set", value: 3.0 },
    velocity_reset: { type: "speed.reset" },
    velocity_pip: { type: "pip.toggle" },
    velocity_boost: { type: "audio.boost.increase", step: 0.5 },
    velocity_silence: { type: "silence.skip.toggle" },
  };

  const action = actionMap[info.menuItemId as string];
  if (action) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: "EXECUTE_ACTION",
        action,
      });
    } catch {
      // Content script may not be running on restricted page
    }
  }
});
