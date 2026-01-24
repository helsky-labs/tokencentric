import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'path';
import { setupIpcHandlers, setupUpdaterIpcHandlers } from './ipc';
import { createMenu } from './menu';
import { initAutoUpdater, checkForUpdates } from './updater';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1F2937' : '#FFFFFF',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle theme changes
  nativeTheme.on('updated', () => {
    mainWindow?.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors);
  });
}

app.whenReady().then(() => {
  createWindow();
  createMenu();
  setupIpcHandlers();
  setupUpdaterIpcHandlers();

  // Initialize auto-updater in production
  if (!isDev && mainWindow) {
    initAutoUpdater(mainWindow);
    // Check for updates after a short delay to not slow down startup
    setTimeout(() => {
      checkForUpdates();
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

export { mainWindow };
