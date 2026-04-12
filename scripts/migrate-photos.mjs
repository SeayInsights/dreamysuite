/**
 * migrate-photos.mjs
 * Downloads photos from dannis-naomi.pages.dev R2 and uploads to DreamySuite R2 + D1.
 * Run: node scripts/migrate-photos.mjs
 * Requires: wrangler login already done, CLOUDFLARE_ACCOUNT_ID env set (or auto-detected).
 */

import { execSync } from 'child_process';
import { createWriteStream, unlinkSync, existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import https from 'https';
import crypto from 'crypto';
import path from 'path';
import os from 'os';

const SITE_ID = 'site_dannis_naomi_01';
const R2_BUCKET = 'dreamysuite-assets';
const DB_NAME = 'dreamysuite-db';
const SOURCE_BASE = 'https://dannis-naomi.pages.dev/images/library/';

const PHOTOS = [
  '5bb597ff-4f23-4d57-9d6d-40b19b72b095.jpg',
  '873a1708-1bf2-4b89-8a5a-baf66a19e626.jpg',
  '79cc898d-7d4c-4fed-a6e1-dc0efd242391.jpg',
  'e8334c07-a4d1-4f1c-ab32-f4ece9ca7c50.jpg',
  '5d674eed-d684-4055-b36d-a59e999e4bbd.jpg',
  'b04b5abc-5ed0-4adc-8eed-5049b1e69ad6.jpg',
  '77ee2704-9266-4cd3-9431-6f14cc524485.jpg',
];

const tmpDir = path.join(os.tmpdir(), 'dreamy-migrate');
if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

function wrangler(cmd) {
  return execSync(`npx wrangler ${cmd}`, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

async function main() {
  console.log(`Migrating ${PHOTOS.length} photos to DreamySuite...\n`);

  for (let i = 0; i < PHOTOS.length; i++) {
    const filename = PHOTOS[i];
    const sourceUrl = SOURCE_BASE + filename;
    const tmpPath = path.join(tmpDir, filename);
    const photoId = crypto.randomUUID();
    const r2Key = `sites/${SITE_ID}/${photoId}/${filename}`;
    const now = Date.now();

    console.log(`[${i + 1}/${PHOTOS.length}] ${filename}`);

    // 1. Download
    process.stdout.write('  Downloading... ');
    await download(sourceUrl, tmpPath);
    const stat = (await readFile(tmpPath)).length;
    console.log(`${Math.round(stat / 1024)} KB`);

    // 2. Upload to R2
    process.stdout.write('  Uploading to R2... ');
    wrangler(`r2 object put "${R2_BUCKET}/${r2Key}" --file="${tmpPath}" --content-type="image/jpeg" --remote`);
    console.log('done');

    // 3. Insert into D1
    process.stdout.write('  Inserting into D1... ');
    const sql = `INSERT INTO photo (id, siteId, r2Key, filename, mimeType, size, sortOrder, createdAt) VALUES ('${photoId}', '${SITE_ID}', '${r2Key}', '${filename}', 'image/jpeg', ${stat}, ${i}, ${now});`;
    wrangler(`d1 execute ${DB_NAME} --remote --command="${sql.replace(/"/g, '\\"')}"`);
    console.log('done');

    // 4. Cleanup temp file
    unlinkSync(tmpPath);
    console.log(`  ✓ ${filename}\n`);
  }

  console.log('All photos migrated successfully!');
  console.log('\nSummary:');
  console.log(`  Music:  https://youtu.be/wzH3MHmIWvU  → media_item (music)`);
  console.log(`  Video:  https://vimeo.com/1175633348   → media_item (video)`);
  console.log(`  Photos: ${PHOTOS.length} images       → R2 + photo table`);
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
