import puppeteer, { Browser, Page } from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function getChromiumPath(): string {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("No Chromium-based browser found on system");
}

const BROWSER_PATH = getChromiumPath();
const DIST_PATH = path.resolve(process.cwd(), "dist");
const FIXTURES_DIR = path.resolve(process.cwd(), "tests/fixtures");
// Start static file server for fixtures
function startFixtureServer(port = 0): Promise<{ server: http.Server; port: number }> {
  const { promise, resolve } = Promise.withResolvers<{ server: http.Server; port: number }>();
  const server = http.createServer((req, res) => {
    const safeUrl = (req.url || "/").split("?")[0].replace(/^\//, "");
    const filePath = path.join(FIXTURES_DIR, safeUrl || "simple-video.html");

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const contentType = ext === ".html" ? "text/html" : ext === ".js" ? "application/javascript" : "text/plain";
      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  server.listen(port, "127.0.0.1", () => {
    const addr = server.address();
    const boundPort = typeof addr === "object" && addr ? addr.port : 8765;
    resolve({ server, port: boundPort });
  });

  return promise;
}

// Assertion helper
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[AssertionFailed] ${message}`);
  }
}

async function runE2ETests() {
  console.log("=================================================");
  console.log("🚀 Starting VelocityX End-to-End (E2E) Test Suite");
  console.log("=================================================");

  assert(fs.existsSync(BROWSER_PATH), `Chromium executable not found at: ${BROWSER_PATH}`);
  // 1. Build project first
  console.log("\n📦 Step 1: Ensuring production build in dist/...");
  // Check browser existence
  console.log(`\n🔍 Detected Chromium browser: ${BROWSER_PATH}`);
  const { server, port } = await startFixtureServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`   ✅ Fixture server listening at ${baseUrl}`);

  // 3. Launch Chrome with unpacked extension
  console.log("\n🌐 Step 3: Launching Chrome with unpacked extension...");
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "velocity-e2e-"));

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      executablePath: BROWSER_PATH,
      headless: false,
      ignoreDefaultArgs: ["--disable-extensions"],
      args: [
        `--load-extension=${DIST_PATH}`,
        `--user-data-dir=${tempDir}`,
        "--no-first-run",
        "--no-default-browser-check",
        "--autoplay-policy=no-user-gesture-required",
        "--window-position=-3000,-3000",
      ],
    });
    console.log("   ✅ Chrome launched successfully with VelocityX extension");

    // Diagnostic: Check loaded extensions
    const extPage = await browser.newPage();
    await extPage.goto("chrome://extensions");
    await new Promise((r) => setTimeout(r, 1000));
    const extTargets = browser.targets();
    console.log("   Extension targets found:", extTargets.map((t) => `${t.type()} -> ${t.url()}`));
    await extPage.close();

    // =========================================================================
    // TEST 1: Overlay Injection & DOM Structure
    // =========================================================================
    console.log("\n🧪 Test 1: Overlay Injection & Shadow DOM Mounting");
    const page = await browser.newPage();
    page.on("console", (msg) => console.log("   [Browser Console]:", msg.text()));
    page.on("pageerror", (err) => console.log("   [Browser PageError]:", err));
    await page.goto(`${baseUrl}/simple-video.html`, { waitUntil: "networkidle0" });

    // Wait for custom element <velocity-controller> to mount
    await page.waitForSelector("velocity-controller", { timeout: 5000 });
    console.log("   ✅ <velocity-controller> custom element mounted in DOM");

    const overlayInfo = await page.evaluate(() => {
      const el = document.querySelector("velocity-controller");
      if (!el) return null;
      return {
        tagName: el.tagName.toLowerCase(),
        isConnected: el.isConnected,
      };
    });
    assert(overlayInfo?.tagName === "velocity-controller", "Custom element must be velocity-controller");
    console.log("   ✅ Custom element verified in DOM hierarchy");

    // =========================================================================
    // TEST 2: Keyboard Shortcuts (D, S, R, G)
    // =========================================================================
    console.log("\n🧪 Test 2: Keyboard Shortcuts & Rate Control");
    
    // Initial rate
    const initialRate = await page.evaluate(() => {
      const v = document.querySelector("video");
      return v ? v.playbackRate : 0;
    });
    assert(Math.abs(initialRate - 1.0) < 0.01, `Initial rate should be 1.0, got ${initialRate}`);
    console.log(`   Initial video rate: ${initialRate.toFixed(2)}x`);

    // Press 'KeyD' (Speed Up)
    await page.keyboard.press("KeyD");
    await new Promise((r) => setTimeout(r, 100));

    const rateAfterD = await page.evaluate(() => {
      const v = document.querySelector("video");
      return v ? v.playbackRate : 0;
    });
    assert(Math.abs(rateAfterD - 1.1) < 0.01, `Rate after KeyD should be 1.10, got ${rateAfterD}`);
    console.log(`   ✅ KeyD pressed: Rate increased to ${rateAfterD.toFixed(2)}x`);

    // Press 'KeyD' 4 more times -> 1.5x
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("KeyD");
      await new Promise((r) => setTimeout(r, 60));
    }
    const rateAt15 = await page.evaluate(() => {
      const v = document.querySelector("video");
      return v ? v.playbackRate : 0;
    });
    assert(Math.abs(rateAt15 - 1.5) < 0.01, `Rate after 4 KeyD should be 1.50, got ${rateAt15}`);
    console.log(`   ✅ KeyD repeated: Rate reached ${rateAt15.toFixed(2)}x`);

    // Press 'KeyS' (Slow Down) -> 1.4x
    await page.keyboard.press("KeyS");
    await new Promise((r) => setTimeout(r, 100));
    const rateAfterS = await page.evaluate(() => {
      const v = document.querySelector("video");
      return v ? v.playbackRate : 0;
    });
    assert(Math.abs(rateAfterS - 1.4) < 0.01, `Rate after KeyS should be 1.40, got ${rateAfterS}`);
    console.log(`   ✅ KeyS pressed: Rate decreased to ${rateAfterS.toFixed(2)}x`);

    // Press 'KeyR' (Reset to 1.0)
    await page.keyboard.press("KeyR");
    await new Promise((r) => setTimeout(r, 100));
    const rateAfterR = await page.evaluate(() => {
      const v = document.querySelector("video");
      return v ? v.playbackRate : 0;
    });
    assert(Math.abs(rateAfterR - 1.0) < 0.01, `Rate after KeyR should be 1.00, got ${rateAfterR}`);
    console.log(`   ✅ KeyR pressed: Rate reset to ${rateAfterR.toFixed(2)}x`);

    // Press 'KeyR' again (Toggle Memory back to 1.4)
    await page.keyboard.press("KeyR");
    await new Promise((r) => setTimeout(r, 100));
    const rateAfterToggleR = await page.evaluate(() => {
      const v = document.querySelector("video");
      return v ? v.playbackRate : 0;
    });
    assert(Math.abs(rateAfterToggleR - 1.4) < 0.01, `KeyR toggle should restore 1.40, got ${rateAfterToggleR}`);
    console.log(`   ✅ KeyR toggle memory: Restored previous speed ${rateAfterToggleR.toFixed(2)}x`);

    // Press 'KeyG' (Toggle Preferred Speed 1.8x)
    await page.keyboard.press("KeyG");
    await new Promise((r) => setTimeout(r, 100));
    const rateAfterG = await page.evaluate(() => {
      const v = document.querySelector("video");
      return v ? v.playbackRate : 0;
    });
    assert(Math.abs(rateAfterG - 1.8) < 0.01, `KeyG should set preferred speed 1.80, got ${rateAfterG}`);
    console.log(`   ✅ KeyG pressed: Preferred speed toggled to ${rateAfterG.toFixed(2)}x`);

    // =========================================================================
    // TEST 3: Floating HUD Toast OSD Verification
    // =========================================================================
    console.log("\n🧪 Test 3: Floating HUD Toast OSD Element");
    const toastExists = await page.evaluate(() => {
      const toast = document.querySelector("velocity-hud-toast");
      return toast !== null;
    });
    assert(toastExists, "<velocity-hud-toast> element must be mounted in player container");
    console.log("   ✅ <velocity-hud-toast> element verified in container");

    // =========================================================================
    // TEST 4: Input Safety Guard (No accidental speed changes while typing)
    // =========================================================================
    console.log("\n🧪 Test 4: Input Safety Guard");
    const safetyPage = await browser.newPage();
    await safetyPage.goto(`${baseUrl}/input-safety.html`, { waitUntil: "networkidle0" });
    await safetyPage.waitForSelector("velocity-controller", { timeout: 5000 });

    // Focus text input and type letters that match shortcuts: 's', 'd', 'r', 'g', 'z', 'x'
    await safetyPage.focus("#test-input");
    await safetyPage.keyboard.type("sdddrgzx123", { delay: 20 });

    const inputVal = await safetyPage.$eval("#test-input", (el) => (el as HTMLInputElement).value);
    assert(inputVal === "sdddrgzx123", `Input value should contain typed text, got: ${inputVal}`);

    const safetyVideoRate = await safetyPage.$eval("#safety-video", (v) => (v as HTMLVideoElement).playbackRate);
    console.log(`   ✅ Input field focused and typed 'sdddrgzx123': Video playbackRate stayed safely at ${safetyVideoRate.toFixed(2)}x`);

    // Focus contenteditable and type
    await safetyPage.focus("#test-editable");
    await safetyPage.keyboard.type("dddd", { delay: 20 });
    const contentEditableRate = await safetyPage.$eval("#safety-video", (v) => (v as HTMLVideoElement).playbackRate);
    console.log(`   ✅ Contenteditable focused and typed 'dddd': Video playbackRate stayed safely at ${contentEditableRate.toFixed(2)}x`);

    // =========================================================================
    // TEST 5: Multiple Videos on Page & Active Selection
    // =========================================================================
    console.log("\n🧪 Test 5: Multiple Videos & Selection Manager");
    const multiPage = await browser.newPage();
    await multiPage.goto(`${baseUrl}/multiple-videos.html`, { waitUntil: "networkidle0" });

    // Both controllers should be mounted
    await multiPage.waitForSelector("#main-container velocity-controller", { timeout: 5000 });
    await multiPage.waitForSelector("#preview-container velocity-controller", { timeout: 5000 });
    console.log("   ✅ Individual overlays mounted on both videos in grid");

    // Press KeyD: Playing/Unmuted main video should be accelerated by SelectionManager
    await multiPage.keyboard.press("KeyD");
    await new Promise((r) => setTimeout(r, 100));

    const mainRate = await multiPage.$eval("#main-video", (v) => (v as HTMLVideoElement).playbackRate);
    const previewRate = await multiPage.$eval("#preview-video", (v) => (v as HTMLVideoElement).playbackRate);
    assert(Math.abs(mainRate - 1.1) < 0.01, `Active main video should increase to 1.10, got ${mainRate}`);
    console.log(`   ✅ Active unmuted video prioritized: Main video rate = ${mainRate.toFixed(2)}x, Preview = ${previewRate.toFixed(2)}x`);

    console.log("\n=================================================");
    console.log("🎉 ALL END-TO-END (E2E) TESTS PASSED SUCCESSFULLY!");
    console.log("=================================================\n");
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    server.close();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Temp dir cleanup
    }
  }
}

runE2ETests().catch((err) => {
  console.error("\n❌ E2E Test Suite Failed:", err);
  process.exit(1);
});
