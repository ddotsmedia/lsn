#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = path.join(__dirname, '..', 'public', 'images');
const outDir = path.join(__dirname, '..', 'public', 'images-optimized');

if (!fs.existsSync(srcDir)) {
  console.log('[SKIP] No public/images directory found');
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const files = fs.readdirSync(srcDir).filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
  if (!files.length) {
    console.log('[SKIP] No images found');
    process.exit(0);
  }

  const manifest = {};
  for (const file of files) {
    const src = path.join(srcDir, file);
    const name = path.parse(file).name;
    manifest[file] = {};

    for (const [label, width] of [['sm', 480], ['md', 1024], ['lg', 1920]]) {
      const out = `${name}-${label}.jpg`;
      await sharp(src).resize(width, null, { withoutEnlargement: true }).jpeg({ quality: 75 }).toFile(path.join(outDir, out));
      manifest[file][label] = out;
    }

    const webp = `${name}.webp`;
    await sharp(src).webp({ quality: 70 }).toFile(path.join(outDir, webp));
    manifest[file].webp = webp;
    console.log(`[✓] ${file}`);
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`[✓] Done: ${files.length} images optimized`);
})();
