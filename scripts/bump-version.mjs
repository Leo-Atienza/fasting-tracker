#!/usr/bin/env node
/**
 * Bump-version script.
 *
 * Updates `version` in package.json AND app.json + `versionCode` / `versionName`
 * in android/app/build.gradle so that all four sources stay in sync. This is
 * the only place to bump versions for an Android local-build APK shipped from
 * `main`. EAS cloud builds with `production.autoIncrement: true` will keep
 * their own counter — this script targets the local-Gradle path only.
 *
 * Usage:
 *   node scripts/bump-version.mjs patch        # 1.0.0 -> 1.0.1
 *   node scripts/bump-version.mjs minor        # 1.0.5 -> 1.1.0
 *   node scripts/bump-version.mjs major        # 1.5.0 -> 2.0.0
 *   node scripts/bump-version.mjs 1.2.3        # explicit
 *
 * versionCode is derived as a monotonically increasing integer from the parts:
 *   major * 10000 + minor * 100 + patch
 * (so 1.0.1 -> 10001, 1.2.3 -> 10203, 2.0.0 -> 20000). Up to minor=99,
 * patch=99 — comfortably enough for hand-bumped Android internal distribution.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');

function parseSemver(s) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(s);
  if (!m) throw new Error(`Not a semver string: ${s}`);
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

function fmt(v) {
  return `${v.major}.${v.minor}.${v.patch}`;
}

function bump(current, kind) {
  if (/^\d+\.\d+\.\d+$/.test(kind)) return parseSemver(kind);
  const v = { ...current };
  if (kind === 'major') {
    v.major += 1;
    v.minor = 0;
    v.patch = 0;
  } else if (kind === 'minor') {
    v.minor += 1;
    v.patch = 0;
  } else if (kind === 'patch') {
    v.patch += 1;
  } else {
    throw new Error(`Unknown bump kind: ${kind}. Use major|minor|patch|<x.y.z>`);
  }
  return v;
}

function versionCode(v) {
  if (v.minor > 99 || v.patch > 99) {
    throw new Error(
      `versionCode formula overflows for ${fmt(v)} (minor/patch must be < 100). ` +
        'Adjust the formula in scripts/bump-version.mjs if you really need it.',
    );
  }
  return v.major * 10000 + v.minor * 100 + v.patch;
}

async function readJson(p) {
  return JSON.parse(await readFile(p, 'utf8'));
}

async function writeJson(p, obj) {
  await writeFile(p, JSON.stringify(obj, null, 2) + '\n');
}

async function main() {
  const kind = process.argv[2];
  if (!kind) {
    console.error('Usage: node scripts/bump-version.mjs <patch|minor|major|x.y.z>');
    process.exit(2);
  }

  const pkgPath = resolve(root, 'package.json');
  const appJsonPath = resolve(root, 'app.json');
  const gradlePath = resolve(root, 'android/app/build.gradle');

  const pkg = await readJson(pkgPath);
  const appJson = await readJson(appJsonPath);
  const current = parseSemver(pkg.version);
  const next = bump(current, kind);
  const code = versionCode(next);
  const name = fmt(next);

  // package.json
  pkg.version = name;
  await writeJson(pkgPath, pkg);

  // app.json
  appJson.expo = appJson.expo ?? {};
  appJson.expo.version = name;
  appJson.expo.android = appJson.expo.android ?? {};
  appJson.expo.android.versionCode = code;
  await writeJson(appJsonPath, appJson);

  // android/app/build.gradle (live manifest, used by `./gradlew assembleDebug`
  // when prebuild is not regenerated). We surgically replace just the two
  // lines so we don't reformat the whole file.
  const gradle = await readFile(gradlePath, 'utf8');
  const updatedGradle = gradle
    .replace(/versionCode\s+\d+/u, `versionCode ${code}`)
    .replace(/versionName\s+"[^"]+"/u, `versionName "${name}"`);
  if (updatedGradle === gradle) {
    console.error(
      'WARN: failed to find versionCode/versionName in android/app/build.gradle. ' +
        'Skipping gradle write (file may have been regenerated since this script was authored).',
    );
  } else {
    await writeFile(gradlePath, updatedGradle);
  }

  console.log(`Bumped ${fmt(current)} -> ${name} (versionCode ${code})`);
  console.log('Updated: package.json, app.json, android/app/build.gradle');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
