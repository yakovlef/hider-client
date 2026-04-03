if (require('electron-squirrel-startup')) process.exit(0);

const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('node:path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
    backgroundColor: '#00000000',
  });

  mainWindow.setContentProtection(true);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setResizable(true);

  if (process.platform === 'win32') {
    mainWindow.setSkipTaskbar(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  }

  if (process.platform === 'darwin') {
    try { mainWindow.setHiddenInMissionControl(true); } catch {}
  }

  // Center on screen
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const x = Math.floor((sw - 600) / 2);
  const y = Math.floor((sh - 400) / 2);
  mainWindow.setPosition(x, y);

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function registerShortcuts() {
  const isMac = process.platform === 'darwin';
  const moveStep = 50;

  // Toggle visibility
  globalShortcut.register(isMac ? 'Cmd+\\' : 'Ctrl+\\', () => {
    if (mainWindow.isVisible()) mainWindow.hide();
    else mainWindow.showInactive();
  });

  // Move window
  globalShortcut.register(isMac ? 'Alt+Up' : 'Ctrl+Up', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y - moveStep);
  });
  globalShortcut.register(isMac ? 'Alt+Down' : 'Ctrl+Down', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y + moveStep);
  });
  globalShortcut.register(isMac ? 'Alt+Left' : 'Ctrl+Left', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x - moveStep, y);
  });
  globalShortcut.register(isMac ? 'Alt+Right' : 'Ctrl+Right', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + moveStep, y);
  });

  // Emergency quit
  globalShortcut.register(isMac ? 'Cmd+Shift+E' : 'Ctrl+Shift+E', () => {
    mainWindow.hide();
    setTimeout(() => app.quit(), 200);
  });
}

// IPC: resize window when switching to work mode
ipcMain.on('resize-window', (event, { width, height }) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setSize(width, height);
    const { width: sw } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setPosition(Math.floor((sw - width) / 2), 0);
  }
});

// IPC: toggle mouse click-through (for reader mode)
let ignoreMouseEvents = false;
ipcMain.on('set-click-through', (event, enabled) => {
  ignoreMouseEvents = enabled;
  if (enabled) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    mainWindow.setIgnoreMouseEvents(false);
  }
});

// IPC: close window
ipcMain.on('close-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();
});

app.on('window-all-closed', () => app.quit());
