import { useState, useEffect } from 'react';

type UpdateStatus = 'idle' | 'available' | 'downloading' | 'ready';

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export function UpdateNotification() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Listen for update events
    window.electronAPI.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setStatus('available');
      setDismissed(false);
    });

    window.electronAPI.onUpdateDownloadProgress((downloadProgress) => {
      setProgress(downloadProgress);
      setStatus('downloading');
    });

    window.electronAPI.onUpdateDownloaded((info) => {
      setUpdateInfo(info);
      setStatus('ready');
    });

    window.electronAPI.onUpdateError(() => {
      // Silently ignore update errors - don't bother the user
      setStatus('idle');
    });
  }, []);

  const handleDownload = () => {
    window.electronAPI.downloadUpdate();
    setStatus('downloading');
  };

  const handleInstall = () => {
    window.electronAPI.installUpdate();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Don't show anything if idle or dismissed
  if (status === 'idle' || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-16 right-4 z-50 max-w-sm">
      <div className="bg-blue-600 dark:bg-blue-700 text-white rounded-lg shadow-lg p-4">
        {status === 'available' && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold">Update Available</h3>
                <p className="text-sm text-blue-100 mt-1">
                  Version {updateInfo?.version} is ready to download.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-blue-200 hover:text-white p-1"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleDownload}
              className="mt-3 w-full bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors"
            >
              Download Update
            </button>
          </>
        )}

        {status === 'downloading' && (
          <>
            <h3 className="font-semibold">Downloading Update...</h3>
            <div className="mt-2">
              <div className="h-2 bg-blue-400 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${progress?.percent || 0}%` }}
                />
              </div>
              <p className="text-sm text-blue-100 mt-1">
                {progress?.percent.toFixed(0)}% complete
              </p>
            </div>
          </>
        )}

        {status === 'ready' && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold">Update Ready</h3>
                <p className="text-sm text-blue-100 mt-1">
                  Version {updateInfo?.version} has been downloaded.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-blue-200 hover:text-white p-1"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleInstall}
              className="mt-3 w-full bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors"
            >
              Restart to Update
            </button>
          </>
        )}
      </div>
    </div>
  );
}
