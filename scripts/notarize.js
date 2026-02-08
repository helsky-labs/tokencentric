const { notarize } = require('@electron/notarize');

const NOTARIZE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const MAX_RETRIES = 2;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Notarization timed out after ${ms / 60000} minutes`)), ms)
    ),
  ]);
}

async function attemptNotarize(appPath, appName, attempt) {
  console.log(`[notarize] Attempt ${attempt}: submitting ${appName} to Apple...`);
  console.log(`[notarize] App path: ${appPath}`);
  console.log(`[notarize] Apple ID: ${process.env.APPLE_ID}`);
  console.log(`[notarize] Team ID: ${process.env.APPLE_TEAM_ID}`);

  const start = Date.now();

  await withTimeout(
    notarize({
      tool: 'notarytool',
      appBundleId: 'app.tokencentric',
      appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    }),
    NOTARIZE_TIMEOUT_MS
  );

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[notarize] Completed in ${elapsed}s`);
}

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD) {
    console.log('[notarize] Skipping: APPLE_ID or APPLE_APP_SPECIFIC_PASSWORD not set');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await attemptNotarize(appPath, appName, attempt);
      return; // success
    } catch (err) {
      console.error(`[notarize] Attempt ${attempt} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        console.log(`[notarize] Retrying in 10s...`);
        await new Promise((r) => setTimeout(r, 10000));
      } else {
        throw err;
      }
    }
  }
};
