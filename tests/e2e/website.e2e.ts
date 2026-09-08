import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

function getChromiumPath(): string {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("Chromium browser executable not found.");
}

async function runWebsiteE2E() {
  console.log("=== Starting VelocityX Website E2E Suite ===");

  // 1. Static file server
  const websiteDir = path.resolve(process.cwd(), "website");
  const server = http.createServer((req, res) => {
    const cleanUrl = (req.url || "/").split("?")[0];
    const file = path.join(websiteDir, cleanUrl === "/" ? "index.html" : cleanUrl);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const ext = path.extname(file);
      const mimeMap: Record<string, string> = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".zip": "application/zip",
        ".png": "image/png",
        ".mp4": "video/mp4",
        ".svg": "image/svg+xml",
      };
      res.writeHead(200, { "Content-Type": mimeMap[ext] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 8765;
  const url = `http://127.0.0.1:${port}/`;
  console.log(`[E2E] Serving website at ${url}`);

  const browser = await puppeteer.launch({
    executablePath: getChromiumPath(),
    headless: true,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    page.on("pageerror", (err) => console.log("[PAGE ERROR]:", err));
    page.on("console", (msg) => console.log("[PAGE LOG]:", msg.text()));
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Test 1: Brand and Title
    const title = await page.title();
    console.log(`[E2E] Page Title: ${title}`);
    if (!title.includes("VelocityX")) throw new Error("Title mismatch");

    // Test 2: Hero Simulator Rate Control
    const initialRate = await page.$eval("#sim-rate-display", (el) => el.textContent?.trim());
    console.log(`[E2E] Initial Rate: ${initialRate}`);

    await page.hover("#sim-controller");
    await page.click("#sim-faster-btn");
    const updatedRate = await page.$eval("#sim-rate-display", (el) => el.textContent?.trim());
    console.log(`[E2E] Rate after click (+): ${updatedRate}`);
    if (updatedRate !== "1.10×") throw new Error(`Expected 1.10× but got ${updatedRate}`);

    // Test 3: Keyboard shortcuts on simulator
    await page.keyboard.press("KeyD");
    const rateKeyD = await page.$eval("#sim-rate-display", (el) => el.textContent?.trim());
    console.log(`[E2E] Rate after KeyD: ${rateKeyD}`);
    if (rateKeyD !== "1.20×") throw new Error(`Expected 1.20× but got ${rateKeyD}`);

    // Test 3b: Preset dials
    await page.click('.preset-dial-btn[data-rate="2.0"]');
    const ratePreset = await page.$eval("#sim-rate-display", (el) => el.textContent?.trim());
    console.log(`[E2E] Rate after 2.0x preset click: ${ratePreset}`);
    if (ratePreset !== "2.00×") throw new Error(`Expected 2.00× but got ${ratePreset}`);

    // Test 3c: Mute toggle
    await page.click("#sim-mute-btn");
    const isMuted = await page.$eval("#demo-video", (v) => (v as HTMLVideoElement).muted);
    console.log(`[E2E] Video muted after toggle: ${isMuted}`);
    if (isMuted) throw new Error("Expected video to be unmuted after click");

    const btnExists = await page.$eval("#open-install-guide-btn", (el) => !!el);
    console.log(`[E2E] #open-install-guide-btn exists: ${btnExists}`);
    await page.evaluate(() => document.getElementById("open-install-guide-btn")?.click());
    const isModalVisible = await page.$eval("#install-modal", (el) => el.classList.contains("visible"));
    console.log(`[E2E] Install modal opened: ${isModalVisible}`);
    if (!isModalVisible) throw new Error("Modal failed to open");

    // Test 5: Switch tab in modal
    await page.click('.tab-btn[data-target="firefox"]');
    const isFirefoxTabActive = await page.$eval('#tab-firefox', (el) => (el as HTMLElement).style.display !== 'none');
    console.log(`[E2E] Firefox tab switched: ${isFirefoxTabActive}`);
    if (!isFirefoxTabActive) throw new Error("Firefox tab failed to activate");

    console.log("=== ALL WEBSITE E2E TESTS PASSED ===");
  } finally {
    await browser.close();
    server.close();
  }
}

runWebsiteE2E().catch((err) => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
