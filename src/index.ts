import { BrowserWindow, Menu, MenuItemConstructorOptions, app } from 'electron';

import { Message } from './interface/message';

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow;

function buildMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Circle',
      submenu: [
        {
          label: 'About WordMark',
          click() {},
        },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click() {
            if (mainWindow) {
              mainWindow.webContents.send(Message.RequestViewPreferences.toString());
            }
          },
        },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click() {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Account',
          accelerator: 'CmdOrCtrl+Shift+N',
          click() {
            if (mainWindow) {
              mainWindow.webContents.send(Message.RequestNewAccount.toString());
            }
          },
        },
        {
          label: 'New Transaction',
          accelerator: 'CmdOrCtrl+N',
          click() {
            if (mainWindow) {
              mainWindow.webContents.send(Message.RequestNewTransaction.toString());
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Import...',
          click() {
            if (mainWindow) {
              mainWindow.webContents.send(Message.RequestImport.toString());
            }
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Mark Cleared',
          accelerator: 'CmdOrCtrl+Shift+c',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send(Message.RequestMarkCleared.toString());
            }
          },
        },
        {
          label: 'Mark Pending',
          accelerator: 'CmdOrCtrl+p',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send(Message.RequestMarkPending.toString());
            }
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+Shift+b',
          click: () => {},
        },
      ],
    },
    {
      role: 'window',
      submenu: [
        {
          label: 'Toggle sidebar',
          accelerator: 'CmdOrCtrl+r',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          },
        },
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'close' },
        { role: 'hide' },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click() {},
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    titleBarStyle: 'hiddenInset',
    width: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
  buildMenu();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
