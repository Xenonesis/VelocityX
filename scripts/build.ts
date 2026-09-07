import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { generateManifest } from "./manifests";

const isWatch = process.argv.includes("--watch");
const distDir = path.resolve(process.cwd(), "dist");
const chromeDir = path.resolve(distDir, "chrome");
const firefoxDir = path.resolve(distDir, "firefox");

function copyFile(src: string, dest: string) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

async function copyStaticAssets() {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf8"));

  // Write Chrome manifest to root dist and dist/chrome
  const chromeManifest = generateManifest("chrome", { version: pkg.version });
  fs.writeFileSync(path.join(distDir, "manifest.json"), JSON.stringify(chromeManifest, null, 2));

  // Icons
  copyDir(path.resolve(process.cwd(), "src/assets/icons"), path.join(distDir, "assets/icons"));

  // Popup HTML & CSS
  copyFile(path.resolve(process.cwd(), "src/ui/popup/popup.html"), path.join(distDir, "ui/popup/popup.html"));
  copyFile(path.resolve(process.cwd(), "src/ui/popup/popup.css"), path.join(distDir, "ui/popup/popup.css"));

  // Options HTML & CSS
  copyFile(path.resolve(process.cwd(), "src/ui/options/options.html"), path.join(distDir, "ui/options/options.html"));
  copyFile(path.resolve(process.cwd(), "src/ui/options/options.css"), path.join(distDir, "ui/options/options.css"));

  // Replicate to dist/chrome and dist/firefox
  const browserOutputs = [
    { dir: chromeDir, target: "chrome" as const },
    { dir: firefoxDir, target: "firefox" as const },
  ];

  const filesToReplicate = [
    "background.js",
    "isolated-bridge.js",
    "main-entry.js",
    "ui/popup/popup.js",
    "ui/popup/popup.html",
    "ui/popup/popup.css",
    "ui/options/options.js",
    "ui/options/options.html",
    "ui/options/options.css",
  ];

  for (const { dir, target } of browserOutputs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    copyDir(path.resolve(process.cwd(), "src/assets/icons"), path.join(dir, "assets/icons"));
    for (const f of filesToReplicate) {
      const srcPath = path.join(distDir, f);
      if (fs.existsSync(srcPath)) {
        copyFile(srcPath, path.join(dir, f));
      }
    }
    const targetManifest = generateManifest(target, { version: pkg.version });
    fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(targetManifest, null, 2));
  }

  console.log("[Build] Copied static assets and generated manifests for Chrome & Firefox");
}

async function build() {
  const startTime = Date.now();
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Common esbuild config
  const commonConfig: esbuild.BuildOptions = {
    bundle: true,
    target: "es2022",
    sourcemap: isWatch ? "inline" : false,
    minify: !isWatch,
    logLevel: "info",
  };

  // 1. Service Worker (ESM format)
  const swConfig: esbuild.BuildOptions = {
    ...commonConfig,
    entryPoints: ["src/background/service-worker.ts"],
    outfile: "dist/background.js",
    format: "esm",
  };

  // 2. Isolated Bridge (IIFE format for content script isolation)
  const bridgeConfig: esbuild.BuildOptions = {
    ...commonConfig,
    entryPoints: ["src/entries/isolated-bridge.ts"],
    outfile: "dist/isolated-bridge.js",
    format: "iife",
  };

  // 3. Main Entry (IIFE format for main world injection)
  const mainConfig: esbuild.BuildOptions = {
    ...commonConfig,
    entryPoints: ["src/entries/main-entry.ts"],
    outfile: "dist/main-entry.js",
    format: "iife",
  };

  // 4. Popup Script (ESM format for HTML script tag)
  const popupConfig: esbuild.BuildOptions = {
    ...commonConfig,
    entryPoints: ["src/ui/popup/popup.ts"],
    outfile: "dist/ui/popup/popup.js",
    format: "esm",
  };

  // 5. Options Script (ESM format for HTML script tag)
  const optionsConfig: esbuild.BuildOptions = {
    ...commonConfig,
    entryPoints: ["src/ui/options/options.ts"],
    outfile: "dist/ui/options/options.js",
    format: "esm",
  };

  const configs = [swConfig, bridgeConfig, mainConfig, popupConfig, optionsConfig];

  if (isWatch) {
    console.log("[Build] Starting watch mode...");
    await copyStaticAssets();
    for (const config of configs) {
      const ctx = await esbuild.context(config);
      await ctx.watch();
    }
  } else {
    for (const config of configs) {
      await esbuild.build(config);
    }
    await copyStaticAssets();
    console.log(`[Build] Completed in ${Date.now() - startTime}ms`);
  }
}

build().catch((err) => {
  console.error("[Build] Error:", err);
  process.exit(1);
});
