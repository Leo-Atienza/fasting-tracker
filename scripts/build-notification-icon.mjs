#!/usr/bin/env node
/**
 * Procedurally render the monochrome Android notification icon to PNG.
 *
 * Why procedural? Neither `sharp` nor `jimp` are installed in this project's
 * node_modules, and `pngjs` (a transitive dep) can't parse SVG. Rather than
 * pull in a 100+ MB headless-Chromium dep just to flatten one tiny icon, we
 * draw the hourglass shape directly as a set of polygons and write the PNG
 * with pngjs.
 *
 * Source of truth for the shape is `assets/source/notification-icon.svg`,
 * which exists for documentation and design review. The polygon math below
 * mirrors that SVG at 192×192 resolution.
 *
 * Output: assets/notification-icon.png — 192×192, white-on-transparent.
 * Android notification small icons are rendered as alpha masks, so any
 * non-zero alpha pixel will be tinted to the channel color at runtime.
 * expo-notifications' config plugin auto-downsamples to mdpi/hdpi/xhdpi/
 * xxhdpi/xxxhdpi drawable buckets at prebuild time.
 *
 * Run: node scripts/build-notification-icon.mjs
 */

import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZE = 192;
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '..', 'assets', 'notification-icon.png');

/**
 * Test whether a point is inside a triangle defined by three vertices using
 * the sign-of-cross-product method. Works for any winding.
 */
function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function pointInRect(px, py, x0, y0, x1, y1) {
  return px >= x0 && px <= x1 && py >= y0 && py <= y1;
}

/**
 * Hourglass at 192×192. Visible band 30..162 vertically, 40..152 horizontally
 * (leaves 30px optical padding all around, matching Material guidance that
 * notification small icons sit inside an 18dp safe square within the 24dp
 * artboard).
 */
function inHourglass(x, y) {
  const top = 30;
  const bottom = 162;
  const left = 40;
  const right = 152;
  const barH = 12;
  const midX = (left + right) / 2;
  const midY = (top + bottom) / 2;

  // Top and bottom bars (the hourglass frame).
  if (pointInRect(x, y, left, top, right, top + barH)) return true;
  if (pointInRect(x, y, left, bottom - barH, right, bottom)) return true;

  // Top funnel — downward triangle.
  if (pointInTriangle(x, y, left, top + barH, right, top + barH, midX, midY)) return true;
  // Bottom funnel — upward triangle.
  if (pointInTriangle(x, y, left, bottom - barH, right, bottom - barH, midX, midY)) return true;

  return false;
}

const png = new PNG({ width: SIZE, height: SIZE });
for (let y = 0; y < SIZE; y += 1) {
  for (let x = 0; x < SIZE; x += 1) {
    const idx = (y * SIZE + x) * 4;
    // Supersample 2×2 to get a clean antialiased edge.
    let hits = 0;
    if (inHourglass(x + 0.25, y + 0.25)) hits += 1;
    if (inHourglass(x + 0.75, y + 0.25)) hits += 1;
    if (inHourglass(x + 0.25, y + 0.75)) hits += 1;
    if (inHourglass(x + 0.75, y + 0.75)) hits += 1;
    const alpha = Math.round((hits / 4) * 255);
    png.data[idx] = 255;
    png.data[idx + 1] = 255;
    png.data[idx + 2] = 255;
    png.data[idx + 3] = alpha;
  }
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
const buf = PNG.sync.write(png);
writeFileSync(OUT_PATH, buf);
console.log(`Wrote ${OUT_PATH} (${SIZE}×${SIZE}, ${buf.length} bytes)`);
