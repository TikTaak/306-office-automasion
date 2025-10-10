const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const userManager = require('./userManager.js');
const notif = require('./src/notification/notif.js');
let mainWindow;

const userFile = path.join(app.getPath('userData'), 'user.json');
// const userFile =  path.join(__dirname, 'user.json');
console.log(userFile);

app.whenReady().then(async () => {
    const user = userManager.init();

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        backgroundColor: 'gray',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    mainWindow.webContents.openDevTools();

    if (!user) {
        mainWindow.loadFile('renderer/ask-name/ask-name.html');
    } else {
        mainWindow.loadFile('renderer/main-window/index.html');
        mainWindow.webContents.on('did-finish-load', async () => {
            await mainWindow.webContents.send('user-data', { user });
        });
    }
});

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
