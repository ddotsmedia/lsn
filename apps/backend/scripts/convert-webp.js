#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'uploads');

async function convertToWebP() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    console.log(`[SKIP] ${UPLOAD_DIR} not found`);
    process.exit(0);
  }

  const files = [];
  function walkDir(dir) {
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
        files.push(fullPath);
      }
    }
  }

  walkDir(UPLOAD_DIR);

  if (files.length === 0) {
    console.log('[SKIP] No images found');
    process.exit(0);
  }

  let totalOriginal = 0;
  let totalWebP = 0;

  console.log(`[→] Converting ${files.length} images to WebP...\n`);

  for (const file of files) {
    const origSize = fs.statSync(file).size;
    const webpPath = `${file}.webp`;

    if (fs.existsSync(webpPath)) {
      console.log(`[✓] ${path.basename(file)} (already exists)`);
      continue;
    }

    try {
      await sharp(file).resize(1920, 1920, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(webpPath);
      const webpSize = fs.statSync(webpPath).size;
      const saved = Math.round(100 - (webpSize / origSize) * 100);
      const origMB = (origSize / 1024 / 1024).toFixed(2);
      const webpMB = (webpSize / 1024 / 1024).toFixed(2);
      console.log(`[✓] ${path.basename(file)} | ${origMB}MB → ${webpMB}MB | -${saved}%`);
      totalOriginal += origSize;
      totalWebP += webpSize;
    } catch (err) {
      console.log(`[✗] ${path.basename(file)} | Error: ${err.message}`);
    }
  }

  const totalOrigMB = (totalOriginal / 1024 / 1024).toFixed(2);
  const totalWebPMB = (totalWebP / 1024 / 1024).toFixed(2);
  const totalSaved = Math.round(100 - (totalWebP / totalOriginal) * 100);

  console.log(`\n[✓] Done: ${files.length} files processed`);
  console.log(`    Total: ${totalOrigMB}MB → ${totalWebPMB}MB saved (-${totalSaved}%)`);
}

convertToWebP().catch(err => {
  console.error('[✗] Error:', err.message);
  process.exit(1);
});
