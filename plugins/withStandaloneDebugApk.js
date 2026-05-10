/**
 * Expo config plugin: produce a self-contained debug APK on local Gradle builds.
 *
 * Why this exists
 * ---------------
 * 1. `gradlew assembleDebug` normally skips embedding the JS bundle because the
 *    React Native gradle plugin's default `debuggableVariants` is `["debug"]`.
 *    The resulting APK fetches its bundle from a Metro dev server at runtime —
 *    so the app hangs on the splash screen on any phone that can't reach Metro
 *    (i.e. any phone we hand someone an APK to install on).
 * 2. `gradlew assembleRelease` would embed the bundle, but on this Windows host
 *    the C++ codegen output path `.cxx/RelWithDebInfo/...` exceeds Windows'
 *    260-character MAX_PATH limit (ninja.exe is not long-path-aware even with
 *    LongPathsEnabled=1 in the registry). The shorter `.cxx/Debug/...` paths
 *    used by the debug variant fit within the limit.
 *
 * So we patch the debug variant to behave like a release variant: embed the JS
 * bundle (`debuggableVariants = []`) and set `debuggable false` so
 * `BuildConfig.DEBUG` is `false`, which makes `getUseDeveloperSupport()` return
 * `false` and React Native loads the embedded bundle instead of trying to fetch
 * one from Metro. Signing stays on the debug keystore so the resulting APK
 * installs over previous local builds without an uninstall step.
 *
 * Without this plugin, `expo prebuild --clean` would regenerate `android/` and
 * silently revert these tweaks, producing another broken-on-launch APK.
 */

const { withAppBuildGradle } = require('@expo/config-plugins');

function patchReactBlock(contents) {
  const reactBlockRegex = /react\s*\{[\s\S]*?\n\}/u;
  const match = reactBlockRegex.exec(contents);
  if (!match) {
    throw new Error("withStandaloneDebugApk: could not find `react { ... }` block in app/build.gradle");
  }
  if (/debuggableVariants\s*=\s*\[\s*\]/u.test(match[0])) {
    return contents;
  }
  const patched = match[0].replace(
    /(\/\*\s*Autolinking\s*\*\/[\s\S]*?autolinkLibrariesWithApp\(\))/u,
    'debuggableVariants = []\n\n    $1',
  );
  if (patched === match[0]) {
    throw new Error('withStandaloneDebugApk: could not anchor on /* Autolinking */ block');
  }
  return contents.replace(reactBlockRegex, patched);
}

function patchDebugBuildType(contents) {
  if (/buildTypes\s*\{[\s\S]*?debug\s*\{[\s\S]*?debuggable\s+false/u.test(contents)) {
    return contents;
  }
  return contents.replace(
    /(buildTypes\s*\{\s*debug\s*\{\s*signingConfig\s+signingConfigs\.debug)/u,
    '$1\n            debuggable false',
  );
}

const withStandaloneDebugApk = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(`withStandaloneDebugApk: expected Groovy build.gradle, got ${cfg.modResults.language}`);
    }
    let contents = cfg.modResults.contents;
    contents = patchReactBlock(contents);
    contents = patchDebugBuildType(contents);
    cfg.modResults.contents = contents;
    return cfg;
  });

module.exports = withStandaloneDebugApk;
