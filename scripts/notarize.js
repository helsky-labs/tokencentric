const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const NOTARIZE_TIMEOUT = '45m';

function verifyCodeSigned(appPath) {
  console.log(`[notarize] Verifying code signature: ${appPath}`);
  try {
    execSync(`codesign --verify --deep --strict "${appPath}" 2>&1`, {
      encoding: 'utf8',
    });
    console.log('[notarize] Code signature verified successfully');
    return true;
  } catch (err) {
    console.error('[notarize] ERROR: App is NOT properly code signed!');
    console.error('[notarize] codesign output:', err.stdout || err.stderr || err.message);
    return false;
  }
}

function logSigningDetails(appPath) {
  try {
    const info = execSync(`codesign -dvv "${appPath}" 2>&1`, { encoding: 'utf8' });
    console.log('[notarize] Signing details:\n' + info);
  } catch (err) {
    console.log('[notarize] Could not retrieve signing details:', err.message);
  }
}

function logAppSize(appPath) {
  try {
    const result = execSync(`du -sh "${appPath}"`, { encoding: 'utf8' }).trim();
    console.log(`[notarize] App bundle size: ${result.split('\t')[0]}`);
  } catch (err) {
    console.log('[notarize] Could not determine app size:', err.message);
  }
}

function runCommand(command, args, label) {
  return new Promise((resolve, reject) => {
    console.log(`[notarize] ${label}: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      // Stream output in real-time for visibility
      process.stdout.write(text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const err = new Error(`${label} failed with exit code ${code}`);
        err.stdout = stdout;
        err.stderr = stderr;
        err.code = code;
        reject(err);
      }
    });

    child.on('error', (err) => {
      reject(new Error(`${label} failed to start: ${err.message}`));
    });
  });
}

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Accept either APPLE_APP_SPECIFIC_PASSWORD (CI) or TOKENCENTRIC_APP_SPECIFIC_PASSWORD (local)
  const appleAppPassword =
    process.env.APPLE_APP_SPECIFIC_PASSWORD || process.env.TOKENCENTRIC_APP_SPECIFIC_PASSWORD;

  if (!process.env.APPLE_ID || !appleAppPassword || !process.env.APPLE_TEAM_ID) {
    console.log('[notarize] Skipping: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD (or TOKENCENTRIC_APP_SPECIFIC_PASSWORD), or APPLE_TEAM_ID not set');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  // Log app size for visibility (105MB+ takes longer to notarize)
  logAppSize(appPath);

  // Verify the app is code signed before attempting notarization
  if (!verifyCodeSigned(appPath)) {
    logSigningDetails(appPath);
    throw new Error(
      'Cannot notarize: app is not code signed. ' +
      'Ensure CSC_LINK and CSC_KEY_PASSWORD are set and contain a valid Developer ID Application certificate.'
    );
  }

  logSigningDetails(appPath);

  // Create zip using ditto (same approach as DropVox's proven pipeline)
  const zipPath = path.join(appOutDir, `${appName}.zip`);
  console.log(`[notarize] Creating zip: ${zipPath}`);

  await runCommand('ditto', ['-c', '-k', '--keepParent', appPath, zipPath], 'ditto zip');

  const zipSize = fs.statSync(zipPath).size;
  console.log(`[notarize] Zip size: ${(zipSize / 1024 / 1024).toFixed(1)} MB`);

  // Submit to Apple using xcrun notarytool directly (bypassing @electron/notarize)
  // This gives us proper --timeout support and full control over the child process
  const start = Date.now();
  console.log(`[notarize] Submitting to Apple notarization service (timeout: ${NOTARIZE_TIMEOUT})...`);

  try {
    await runCommand('xcrun', [
      'notarytool', 'submit', zipPath,
      '--apple-id', process.env.APPLE_ID,
      '--team-id', process.env.APPLE_TEAM_ID,
      '--password', appleAppPassword,
      '--wait',
      '--timeout', NOTARIZE_TIMEOUT,
    ], 'notarytool submit');
  } catch (err) {
    // Clean up zip before throwing
    try { fs.unlinkSync(zipPath); } catch (_) {}

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`[notarize] Notarization failed after ${elapsed}s`);
    console.error(`[notarize] stdout: ${err.stdout || '(none)'}`);
    console.error(`[notarize] stderr: ${err.stderr || '(none)'}`);
    throw new Error(`Notarization failed: ${err.message}`);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[notarize] Notarization accepted in ${elapsed}s`);

  // Staple the notarization ticket to the app bundle
  console.log('[notarize] Stapling notarization ticket...');
  await runCommand('xcrun', ['stapler', 'staple', appPath], 'stapler staple');

  // Clean up zip
  try { fs.unlinkSync(zipPath); } catch (_) {}

  console.log('[notarize] Notarization and stapling complete!');
};
