import fs from "node:fs";
import path from "node:path";

export interface SyncOptions {
  releaseDir: string;
  iconsDir: string;
  websiteDir: string;
}

export function syncWebsiteAssets(options: SyncOptions): { syncedFiles: string[] } {
  const { releaseDir, iconsDir, websiteDir } = options;
  const downloadsTarget = path.join(websiteDir, "assets", "downloads");
  const iconsTarget = path.join(websiteDir, "assets", "icons");

  fs.mkdirSync(downloadsTarget, { recursive: true });
  fs.mkdirSync(iconsTarget, { recursive: true });

  const syncedFiles: string[] = [];

  if (fs.existsSync(releaseDir)) {
    const releaseFiles = fs.readdirSync(releaseDir).filter((f) => f.endsWith(".zip"));
    for (const file of releaseFiles) {
      const src = path.join(releaseDir, file);
      const dest = path.join(downloadsTarget, file);
      fs.copyFileSync(src, dest);
      syncedFiles.push(dest);
    }
  }

  if (fs.existsSync(iconsDir)) {
    const iconFiles = fs.readdirSync(iconsDir).filter((f) => f.endsWith(".png") || f.endsWith(".svg"));
    for (const file of iconFiles) {
      const src = path.join(iconsDir, file);
      const dest = path.join(iconsTarget, file);
      fs.copyFileSync(src, dest);
      syncedFiles.push(dest);
    }
  }

  return { syncedFiles };
}

// CLI execution
if (process.argv[1] && (process.argv[1].includes("sync-website-assets") || process.argv[1].endsWith("sync-website-assets.ts"))) {
  const root = process.cwd();
  const websiteRes = syncWebsiteAssets({
    releaseDir: path.join(root, "release"),
    iconsDir: path.join(root, "src/assets/icons"),
    websiteDir: path.join(root, "website"),
  });
  const rootRes = syncWebsiteAssets({
    releaseDir: path.join(root, "release"),
    iconsDir: path.join(root, "src/assets/icons"),
    websiteDir: root,
  });
  console.log(`[Website Sync] Synced ${websiteRes.syncedFiles.length} website assets and ${rootRes.syncedFiles.length} root assets.`);
}
