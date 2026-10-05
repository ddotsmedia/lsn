#!/usr/bin/env node
const pg = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env.production') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateToWebP() {
  const client = await pool.connect();
  try {
    console.log('[→] Migrating image URLs to WebP format...\n');

    const result = await client.query(
      `SELECT id, image_url FROM gallery_images
       WHERE image_url ILIKE '%.jpg' OR image_url ILIKE '%.jpeg' OR image_url ILIKE '%.png'
       ORDER BY created_at ASC`
    );

    if (result.rows.length === 0) {
      console.log('[SKIP] No JPG/PNG images found to migrate\n');
      return;
    }

    let updated = 0;
    for (const row of result.rows) {
      const oldUrl = row.image_url;
      const ext = path.extname(oldUrl).toLowerCase();
      const newUrl = oldUrl.replace(ext, '.webp');

      await client.query(
        'UPDATE gallery_images SET image_url = $1 WHERE id = $2',
        [newUrl, row.id]
      );
      updated++;
      console.log(`[✓] ${oldUrl} → ${newUrl}`);
    }

    console.log(`\n[✓] Migration complete: ${updated} images updated`);
  } catch (error) {
    console.error('[✗] Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateToWebP();
