/**
 * DESIGN FORGE — Media Sanitizer & Watermark Cleaner
 * Automatically removes bottom-right Gemini / Nano Banana sparkle badges and
 * Google Flow / Veo corner watermarks from all files in:
 *   - sites/adobe-showcase/public/media/images/*.{png,jpg,jpeg,webp}
 *   - sites/adobe-showcase/public/media/videos/*.mp4
 *
 * Uses asymmetric top-left-anchored crop + Lanczos upscale via FFmpeg so the
 * bottom-right 6.5% corner watermark is physically removed from the asset files.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_ROOT = path.resolve(
  __dirname,
  '../sites/adobe-showcase/public/media'
);
const IMAGES_DIR = path.join(MEDIA_ROOT, 'images');
const VIDEOS_DIR = path.join(MEDIA_ROOT, 'videos');
const STAMP_FILE = path.join(MEDIA_ROOT, '.cleaned-manifest.json');

function loadCleanedManifest(): Record<string, number> {
  if (!fs.existsSync(STAMP_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STAMP_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveCleanedManifest(manifest: Record<string, number>) {
  fs.writeFileSync(STAMP_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
}

function cleanImages(manifest: Record<string, number>) {
  if (!fs.existsSync(IMAGES_DIR)) return;
  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && !f.startsWith('tmp_'));

  if (files.length === 0) {
    console.log('ℹ️  No images found in public/media/images/ yet.');
    return;
  }

  for (const file of files) {
    const fullPath = path.join(IMAGES_DIR, file);
    const stat = fs.statSync(fullPath);

    if (manifest[fullPath] === stat.mtimeMs) {
      console.log(`⏭️  Skipping already-cleaned image: ${file}`);
      continue;
    }

    const tempOut = path.join(IMAGES_DIR, `tmp_clean_${file}`);
    console.log(`✨ Removing bottom-right Gemini watermark from image: ${file}...`);

    // Crop 93.5% width & height anchored at (0,0) top-left so bottom-right corner sparkle is removed
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-i',
        fullPath,
        '-vf',
        'crop=iw*0.935:ih*0.935:0:0,scale=iw/0.935:ih/0.935:flags=lanczos',
        tempOut,
      ],
      { stdio: 'ignore' }
    );

    fs.renameSync(tempOut, fullPath);
    const updatedStat = fs.statSync(fullPath);
    manifest[fullPath] = updatedStat.mtimeMs;
    console.log(`✅ Cleaned image: ${file}`);
  }
}

function cleanVideos(manifest: Record<string, number>) {
  if (!fs.existsSync(VIDEOS_DIR)) return;
  const files = fs
    .readdirSync(VIDEOS_DIR)
    .filter((f) => /\.(mp4|webm|mov)$/i.test(f) && !f.startsWith('tmp_'));

  if (files.length === 0) {
    console.log('ℹ️  No videos found in public/media/videos/ yet.');
    return;
  }

  for (const file of files) {
    const fullPath = path.join(VIDEOS_DIR, file);
    const stat = fs.statSync(fullPath);

    if (manifest[fullPath] === stat.mtimeMs) {
      console.log(`⏭️  Skipping already-cleaned video: ${file}`);
      continue;
    }

    const tempOut = path.join(VIDEOS_DIR, `tmp_clean_${file}`);
    console.log(`🎬 Removing bottom-right Veo/Flow watermark from video: ${file}...`);

    // Crop 93% width & height anchored at (0,0) top-left + re-encode H.264 high-profile seamless web loop
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-i',
        fullPath,
        '-vf',
        'crop=iw*0.93:ih*0.93:0:0,scale=trunc(iw/0.93/2)*2:trunc(ih/0.93/2)*2:flags=lanczos',
        '-c:v',
        'libx264',
        '-crf',
        '18',
        '-preset',
        'fast',
        '-pix_fmt',
        'yuv420p',
        '-an',
        tempOut,
      ],
      { stdio: 'ignore' }
    );

    fs.renameSync(tempOut, fullPath);
    const updatedStat = fs.statSync(fullPath);
    manifest[fullPath] = updatedStat.mtimeMs;
    console.log(`✅ Cleaned video: ${file}`);
  }
}

function main() {
  console.log('======================================================');
  console.log('🧼 DESIGN FORGE — Gemini / Google Flow Watermark Cleaner');
  console.log('======================================================');
  const manifest = loadCleanedManifest();
  cleanImages(manifest);
  cleanVideos(manifest);
  saveCleanedManifest(manifest);
  console.log('🎉 All media slots checked & sanitized!');
}

main();
