/**
 * Generates placeholder PNG images for assets and inserts AssetImage records.
 * Run: node scripts/seed-images.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Minimal CRC32 implementation ──────────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ── PNG generator ─────────────────────────────────────────────────────────────
function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typ = Buffer.from(type);
  const body = Buffer.concat([typ, data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, c]);
}

function createGradientPNG(width, height, r1, g1, b1, r2, g2, b2) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Image data — vertical gradient from color1 to color2
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    const off = y * (1 + width * 3);
    raw[off] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      // Add slight horizontal variation for visual interest
      const xVar = Math.round(Math.sin(x / width * Math.PI) * 15);
      raw[off + 1 + x * 3 + 0] = Math.min(255, Math.max(0, r + xVar));
      raw[off + 1 + x * 3 + 1] = Math.min(255, Math.max(0, g + xVar));
      raw[off + 1 + x * 3 + 2] = Math.min(255, Math.max(0, b));
    }
  }

  const compressed = zlib.deflateSync(raw);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Image definitions (different color gradients per "angle") ─────────────────
const imageSpecs = [
  // Asset 9 images (5 photos)
  { assetId: 9, caption: 'Front View', isPrimary: true,  c1: [15, 45, 82],  c2: [40, 100, 160] },
  { assetId: 9, caption: 'Left Side',  isPrimary: false, c1: [26, 107, 53], c2: [100, 180, 120] },
  { assetId: 9, caption: 'Night View', isPrimary: false, c1: [20, 20, 40],  c2: [60, 50, 100] },
  { assetId: 9, caption: 'Street Perspective', isPrimary: false, c1: [180, 120, 50], c2: [220, 180, 100] },
  { assetId: 9, caption: 'Close-up Detail', isPrimary: false, c1: [100, 50, 50], c2: [180, 100, 80] },

  // Asset 11 images (4 photos)
  { assetId: 11, caption: 'Front View', isPrimary: true,  c1: [79, 70, 229], c2: [130, 120, 245] },
  { assetId: 11, caption: 'Right Side', isPrimary: false, c1: [200, 151, 42], c2: [240, 200, 100] },
  { assetId: 11, caption: 'Aerial View', isPrimary: false, c1: [50, 120, 180], c2: [100, 180, 220] },
  { assetId: 11, caption: 'Night Illumination', isPrimary: false, c1: [30, 15, 60], c2: [80, 40, 140] },
];

async function main() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  console.log('Generating placeholder images...\n');

  for (const spec of imageSpecs) {
    const filename = `asset-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
    const filePath = path.join(uploadsDir, filename);

    // 640x480 gradient image
    const pngBuffer = createGradientPNG(640, 480, ...spec.c1, ...spec.c2);
    fs.writeFileSync(filePath, pngBuffer);

    const record = await prisma.assetImage.create({
      data: {
        assetId: spec.assetId,
        url: `/uploads/${filename}`,
        caption: spec.caption,
        isPrimary: spec.isPrimary,
      },
    });

    console.log(`  [Asset ${spec.assetId}] ${spec.caption} → ${filename} (id: ${record.id})`);

    // Small delay to ensure unique timestamps in filenames
    await new Promise((r) => setTimeout(r, 15));
  }

  console.log(`\nDone! Created ${imageSpecs.length} images for assets 9 and 11.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
