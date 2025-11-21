const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const squirrel = require('electron-squirrel-startup');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const userManager = require('./userManager.js');
const notif = require('./src/notification/notif.js');
const { updateElectronApp } = require('update-electron-app');
try {
    updateElectronApp();
} catch (error) {}

let mainWindow;
const DEBUG = false;

const userFile = path.join(app.getPath('userData'), 'user.json');
// const userFile =  path.join(__dirname, 'user.json');
console.log(userFile);

app.whenReady().then(async () => {
    const user = userManager.init();

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        title: 'dood v' + app.getVersion(),
        backgroundColor: 'gray',
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        preload: path.join(__dirname, 'renderer', 'update.preload.js'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    if (DEBUG) {
        mainWindow.webContents.openDevTools();
    }

    if (!user) {
        mainWindow.loadFile('renderer/ask-name/ask-name.html');
    } else {
        mainWindow.loadFile('renderer/main-window/index.html');
        mainWindow.webContents.on('did-finish-load', async () => {
            await mainWindow.webContents.send('user-data', { user });
        });
    }
});

if (squirrel) {
    // TODO: Exit app if we are in setup.
    return;
}

ipcMain.on('save-user-data', async (event, { name, host }) => {
    const user = await userManager.saveUser({
        name,
        host,
    });

    if (user) {
        mainWindow.loadFile('renderer/main-window/index.html');
        mainWindow.webContents.on('did-finish-load', async () => {
            await mainWindow.webContents.send('user-data', { user });
        });
    } else {
        await mainWindow.loadFile('renderer/ask-name/ask-name.html');
    }
});

ipcMain.on('logout', async () => {
    await userManager.deleteUser();
    await mainWindow.loadFile('renderer/ask-name/ask-name.html');
});

ipcMain.on('close-notification', (event, id) => {
    const win = notif.notifications.find((n) => n.__notificationId === id);
    if (win) {
        // TODO: Set message seen status to true;
        win.close();
    }
});

ipcMain.on('show-notification', (event, data) => {
    notif.showPersistentNotification(data.sender, data.message, data.messageId);
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('check-for-updates', async () => {
    try {
        const update = await autoUpdater.checkForUpdates();
        return update.updateInfo.version
            ? { updateAvailable: true, version: update.updateInfo.version }
            : { updateAvailable: false };
    } catch (err) {
        return { updateAvailable: false, error: err.message };
    }
});

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
});
