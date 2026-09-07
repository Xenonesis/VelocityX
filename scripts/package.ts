import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

interface ZipEntry {
  path: string;
  data: Buffer;
  crc32: number;
  compressed: Buffer;
  offset: number;
}

function crc32(buf: Buffer): number {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

export function buildZip(sourceDir: string, outputFile: string): void {
  const files = getAllFiles(sourceDir);
  const entries: ZipEntry[] = [];
  const localChunks: Buffer[] = [];
  let currentOffset = 0;

  for (const filePath of files) {
    const relativePath = path.relative(sourceDir, filePath).replace(/\\/g, "/");
    const data = fs.readFileSync(filePath);
    const crc = crc32(data);
    const compressed = zlib.deflateRawSync(data);

    const pathBuf = Buffer.from(relativePath, "utf8");

    // Local file header (30 bytes + name + data)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Signature
    localHeader.writeUInt16LE(20, 4); // Min version (2.0)
    localHeader.writeUInt16LE(0, 6); // Flags
    localHeader.writeUInt16LE(8, 8); // Method (8 = deflate)
    localHeader.writeUInt16LE(0, 10); // Mod time
    localHeader.writeUInt16LE(0, 12); // Mod date
    localHeader.writeUInt32LE(crc, 14); // CRC32
    localHeader.writeUInt32LE(compressed.length, 18); // Compressed size
    localHeader.writeUInt32LE(data.length, 22); // Uncompressed size
    localHeader.writeUInt16LE(pathBuf.length, 26); // Filename length
    localHeader.writeUInt16LE(0, 28); // Extra field length

    entries.push({
      path: relativePath,
      data,
      crc32: crc,
      compressed,
      offset: currentOffset,
    });

    localChunks.push(localHeader, pathBuf, compressed);
    currentOffset += localHeader.length + pathBuf.length + compressed.length;
  }

  // Central Directory
  const centralChunks: Buffer[] = [];
  let centralDirSize = 0;

  for (const entry of entries) {
    const pathBuf = Buffer.from(entry.path, "utf8");
    const cdHeader = Buffer.alloc(46);

    cdHeader.writeUInt32LE(0x02014b50, 0); // Signature
    cdHeader.writeUInt16LE(20, 4); // Version made by
    cdHeader.writeUInt16LE(20, 6); // Min version to extract
    cdHeader.writeUInt16LE(0, 8); // Flags
    cdHeader.writeUInt16LE(8, 10); // Method (deflate)
    cdHeader.writeUInt16LE(0, 12); // Mod time
    cdHeader.writeUInt16LE(0, 14); // Mod date
    cdHeader.writeUInt32LE(entry.crc32, 16); // CRC32
    cdHeader.writeUInt32LE(entry.compressed.length, 20); // Compressed size
    cdHeader.writeUInt32LE(entry.data.length, 24); // Uncompressed size
    cdHeader.writeUInt16LE(pathBuf.length, 28); // Filename length
    cdHeader.writeUInt16LE(0, 30); // Extra field length
    cdHeader.writeUInt16LE(0, 32); // Comment length
    cdHeader.writeUInt16LE(0, 34); // Disk number start
    cdHeader.writeUInt16LE(0, 36); // Internal file attrs
    cdHeader.writeUInt32LE(0, 38); // External file attrs
    cdHeader.writeUInt32LE(entry.offset, 42); // Relative offset of local header

    centralChunks.push(cdHeader, pathBuf);
    centralDirSize += cdHeader.length + pathBuf.length;
  }

  // End of Central Directory (EOCD)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // Signature
  eocd.writeUInt16LE(0, 4); // Disk number
  eocd.writeUInt16LE(0, 6); // Start disk
  eocd.writeUInt16LE(entries.length, 8); // Number of entries on disk
  eocd.writeUInt16LE(entries.length, 10); // Total entries
  eocd.writeUInt32LE(centralDirSize, 12); // Central dir size
  eocd.writeUInt32LE(currentOffset, 16); // Offset of central dir
  eocd.writeUInt16LE(0, 20); // Comment length

  const finalZipBuffer = Buffer.concat([...localChunks, ...centralChunks, eocd]);

  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, finalZipBuffer);
  console.log(`[Package] Successfully created ${outputFile} (${(finalZipBuffer.length / 1024).toFixed(1)} KB)`);
}

const distDir = path.resolve(process.cwd(), "dist");
const chromeDir = path.resolve(distDir, "chrome");
const firefoxDir = path.resolve(distDir, "firefox");
const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf8"));

// 1. Standard Chrome store zip
buildZip(chromeDir, path.resolve(process.cwd(), `release/velocityx-chrome-v${packageJson.version}.zip`));
buildZip(chromeDir, path.resolve(process.cwd(), `release/velocityx-v${packageJson.version}.zip`));

// 2. Firefox Add-ons store zip
if (fs.existsSync(firefoxDir)) {
  buildZip(firefoxDir, path.resolve(process.cwd(), `release/velocityx-firefox-v${packageJson.version}.zip`));
}
