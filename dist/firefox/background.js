console.log("[Velocity] Service worker initialized");chrome.runtime.onInstalled.addListener(async e=>{console.log("[Velocity] Extension installed/updated:",e.reason)});
