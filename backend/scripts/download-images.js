/**
 * Downloads real billboard stock images from Unsplash and replaces placeholder images.
 * Run: node scripts/download-images.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const images = [
  // Asset 9 — Unipole
  { id: 1, assetId: 9, caption: 'Front View',          isPrimary: true,  url: 'https://images.unsplash.com/photo-1633618110154-7b7040dce3d5?w=800&q=80' },
  { id: 2, assetId: 9, caption: 'Side Angle',           isPrimary: false, url: 'https://images.unsplash.com/photo-1699480114704-ac153307d2a0?w=800&q=80' },
  { id: 3, assetId: 9, caption: 'Night View',           isPrimary: false, url: 'https://images.unsplash.com/photo-1762417582231-d4861d804c17?w=800&q=80' },
  { id: 4, assetId: 9, caption: 'Street Perspective',   isPrimary: false, url: 'https://images.unsplash.com/photo-1680921925104-71d857057238?w=800&q=80' },
  { id: 5, assetId: 9, caption: 'Close-up Detail',      isPrimary: false, url: 'https://images.unsplash.com/photo-1585700201969-be9dd4e40aa1?w=800&q=80' },
  // Asset 11 — Hoarding
  { id: 6, assetId: 11, caption: 'Front View',          isPrimary: true,  url: 'https://images.unsplash.com/photo-1712364677551-f77013be1c91?w=800&q=80' },
  { id: 7, assetId: 11, caption: 'Side Angle',          isPrimary: false, url: 'https://images.unsplash.com/photo-1703897059803-3b076c4505be?w=800&q=80' },
  { id: 8, assetId: 11, caption: 'Wide Street View',    isPrimary: false, url: 'https://images.unsplash.com/photo-1743670476920-81ca1b70a4ba?w=800&q=80' },
  { id: 9, assetId: 11, caption: 'Night Illumination',  isPrimary: false, url: 'https://images.unsplash.com/photo-1762417582263-7f423d344b77?w=800&q=80' },
];

function download(url) {
  return new Promise((resolve, reject) => {
    const request = (u) => {
      https.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location); // follow redirect
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    request(url);
  });
}

async function main() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  for (const img of images) {
    process.stdout.write(`  Downloading [Asset ${img.assetId}] ${img.caption}...`);
    try {
      const buffer = await download(img.url);
      const filename = `asset-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, buffer);
      const sizeKB = Math.round(buffer.length / 1024);

      // Delete old record's file
      const old = await prisma.assetImage.findUnique({ where: { id: img.id } });
      if (old) {
        const oldFile = path.join(uploadsDir, path.basename(old.url));
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }

      // Update DB record
      await prisma.assetImage.update({
        where: { id: img.id },
        data: { url: `/uploads/${filename}`, caption: img.caption },
      });

      console.log(` OK (${sizeKB}KB) → ${filename}`);
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 500)); // rate limit
  }

  console.log('\nDone!');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
