import { app, Menu, shell, BrowserWindow } from 'electron';

const isMac = process.platform === 'darwin';

export function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              {
                label: 'About Tokencentric',
                click: () => {
                  BrowserWindow.getFocusedWindow()?.webContents.send('show-about');
                },
              },
              { type: 'separator' as const },
              {
                label: 'Settings',
                accelerator: 'Cmd+,',
                click: () => {
                  BrowserWindow.getFocusedWindow()?.webContents.send('open-settings');
                },
              },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('new-file');
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('save-file');
          },
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('close-tab');
          },
        },
        { type: 'separator' },
        {
          label: 'Scan Directory',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('scan-directory');
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Next Tab',
          accelerator: 'CmdOrCtrl+Shift+]',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('next-tab');
          },
        },
        {
          label: 'Previous Tab',
          accelerator: 'CmdOrCtrl+Shift+[',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send('previous-tab');
          },
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://tokencentric.app/docs');
          },
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/helrabelo/tokencentric/issues');
          },
        },
        { type: 'separator' },
        {
          label: 'Buy Me a Coffee',
          click: () => {
            shell.openExternal('https://buymeacoffee.com/helrabelo');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
