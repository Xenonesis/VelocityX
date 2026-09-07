import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type: string, data: Buffer): Buffer {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, "ascii");
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function createPNG(width: number, height: number, getPixel: (x: number, y: number) => RGBA): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth: 8
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk("IHDR", ihdrData);

  // Raw image data with filter byte (0 = None) per scanline
  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawScanlines[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const p = getPixel(x, y);
      rawScanlines[offset++] = Math.round(p.r);
      rawScanlines[offset++] = Math.round(p.g);
      rawScanlines[offset++] = Math.round(p.b);
      rawScanlines[offset++] = Math.round(p.a);
    }
  }

  // IDAT
  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = createChunk("IDAT", compressed);

  // IEND
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Draws Velocity Icon:
 * Dark blue-slate rounded squircle background (#0f172a)
 * Cyan fast-forward double chevron (#38bdf8 & #0284c7)
 */
function renderVelocityIcon(size: number): Buffer {
  const radius = size * 0.22;
  const center = size / 2;

  return createPNG(size, size, (x, y) => {
    // Distance from center for rounded rectangle calculation
    const dx = Math.max(Math.abs(x - center + 0.5) - (center - radius), 0);
    const dy = Math.max(Math.abs(y - center + 0.5) - (center - radius), 0);
    const distToCorner = Math.sqrt(dx * dx + dy * dy);

    // Antialiased corner cutout
    if (distToCorner > radius) {
      const alphaFalloff = Math.max(0, 1 - (distToCorner - radius));
      if (alphaFalloff <= 0) {
        return { r: 0, g: 0, b: 0, a: 0 };
      }
    }

    // Default background color: slate-900 (#0f172a) with subtle vertical gradient to indigo-950 (#1e1b4b)
    const t = y / size;
    let r = Math.round(15 * (1 - t) + 30 * t);
    let g = Math.round(23 * (1 - t) + 27 * t);
    let b = Math.round(42 * (1 - t) + 75 * t);
    let a = 255;

    // Outer border stroke: subtle cyan border
    if (distToCorner >= radius - 1 || x <= 1 || x >= size - 2 || y <= 1 || y >= size - 2) {
      r = Math.round(r * 0.5 + 56 * 0.5);
      g = Math.round(g * 0.5 + 189 * 0.5);
      b = Math.round(b * 0.5 + 248 * 0.5);
    }

    // Scale coordinates to [0, 1] range for chevron rendering
    const nx = x / size;
    const ny = y / size;

    // Chevron 1 (Left chevron, cyan #38bdf8)
    // Points: (0.28, 0.28) -> (0.46, 0.50) -> (0.28, 0.72)
    // Chevron 2 (Right chevron, bright white #ffffff)
    // Points: (0.50, 0.28) -> (0.68, 0.50) -> (0.50, 0.72)
    const thickness = size >= 48 ? 0.10 : 0.14;

    const inChevron = (cx: number, cy: number, startX: number) => {
      const midY = 0.50;
      const slope = 1.15;
      const armX = startX + (1 - Math.abs(cy - midY) / 0.25) * 0.16;
      const diff = Math.abs(cx - armX);
      return diff < thickness && cy >= 0.26 && cy <= 0.74;
    };

    if (inChevron(nx, ny, 0.48)) {
      // Right chevron - bright white with slight electric cyan
      return { r: 255, g: 255, b: 255, a: 255 };
    }

    if (inChevron(nx, ny, 0.28)) {
      // Left chevron - electric cyan (#38bdf8)
      return { r: 56, g: 189, b: 248, a: 255 };
    }

    return { r, g, b, a };
  });
}

function main() {
  const outDir = path.resolve(process.cwd(), "src/assets/icons");
  fs.mkdirSync(outDir, { recursive: true });

  const sizes = [16, 48, 128];
  for (const size of sizes) {
    const png = renderVelocityIcon(size);
    const dest = path.join(outDir, `icon-${size}.png`);
    fs.writeFileSync(dest, png);
    console.log(`Generated icon: ${dest} (${size}x${size}, ${png.length} bytes)`);
  }
}

main();
