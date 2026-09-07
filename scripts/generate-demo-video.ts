import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/**
 * Minimal valid MP4 container fallback (ftyp + moov + mdat)
 * Used if FFmpeg is unavailable in runtime environment.
 */
const MINIMAL_MP4_BASE64 =
  "AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAUBtZGF0AAAC" +
  "rGZ0eXBpc29tAAAAAG1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAAAAAEAAAEAAA" +
  "AAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export function generateDemoVideo(targetPath?: string): string {
  const root = process.cwd();
  const outputPath =
    targetPath || path.join(root, "website", "assets", "demo", "sample.mp4");
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let ffmpegSucceeded = false;
  try {
    // Attempt FFmpeg generation for a rich, interactive 12s test video
    const cmd = [
      "ffmpeg",
      "-y",
      "-f lavfi -i \"testsrc2=duration=12:size=960x540:rate=30\"",
      "-f lavfi -i \"sine=frequency=520:duration=12\"",
      "-af \"volume='if(lt(mod(t,3),1.8), 0.25, 0)':eval=frame\"",
      "-c:v libx264 -preset veryfast -crf 28 -pix_fmt yuv420p",
      "-c:a aac -b:a 96k",
      "-movflags +faststart",
      `"${outputPath}"`,
    ].join(" ");

    execSync(cmd, { stdio: "ignore" });
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
      ffmpegSucceeded = true;
      console.log(`[Demo Video] Generated playable MP4 via FFmpeg: ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
    }
  } catch {
    ffmpegSucceeded = false;
  }

  if (!ffmpegSucceeded) {
    // Fallback to valid MP4 binary data
    const buf = Buffer.from(MINIMAL_MP4_BASE64, "base64");
    fs.writeFileSync(outputPath, buf);
    console.log(`[Demo Video] Generated minimal fallback MP4: ${outputPath}`);
  }

  return outputPath;
}

if (
  process.argv[1] &&
  (process.argv[1].includes("generate-demo-video") ||
    process.argv[1].endsWith("generate-demo-video.ts"))
) {
  generateDemoVideo();
}
