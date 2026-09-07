// Velocity - Background Service Worker
console.log("[Velocity] Service worker initialized");

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[Velocity] Extension installed/updated:", details.reason);
});
