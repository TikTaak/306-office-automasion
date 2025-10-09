const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const userManager = require('./userManager.js');

let mainWindow;

const userFile = path.join(app.getPath('userData'), 'user.json');
// const userFile =  path.join(__dirname, 'user.json');
console.log(userFile);

/* ------------------------------------ */

let notifications = [];

function showPersistentNotification(sender, message, messageId) {
    const { width } = screen.getPrimaryDisplay().workAreaSize;

    const notificationWidth = 300;
    const notificationHeight = 100;
    const margin = 10;

    const yPosition =
        margin + notifications.length * (notificationHeight + margin);

    const id = messageId;
    // const id = Math.random().toString(36).substr(2, 9);

    const win = new BrowserWindow({
        width: notificationWidth,
        height: notificationHeight,
        x: width - notificationWidth - margin,
        y: yPosition,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        transparent: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            additionalArguments: [`--notifId=${id}`], // فرستادن id به رندرر
        },
    });

    win.__notificationId = id;
    notifications.push(win);

    win.loadURL(
        'data:text/html;charset=utf-8,' +
            encodeURIComponent(`
    <body style="margin:0; display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(0,0,0,0.85); color:white; font-family:sans-serif;">
      <h4 style="margin:5px;">${sender}</h4>
      <p style="margin:5px;">${message}</p>
      <button id="closeBtn" style="padding:5px 10px; margin-top:5px; cursor:pointer;">بستن</button>
      <script>
        const { ipcRenderer } = require('electron');
        // گرفتن id از arguments
        const args = process.argv.find(a => a.startsWith('--notifId='));
        const notifId = parseInt(args.split('=')[1]);

        document.getElementById('closeBtn').addEventListener('click', () => {
          if (notifId) ipcRenderer.send('close-notification', notifId);
        });
      </script>
    </body>
  `),
    );

    win.on('closed', () => {
        notifications = notifications.filter((n) => n !== win);
        updateNotificationsPosition();
    });
}

function updateNotificationsPosition() {
    const { width } = screen.getPrimaryDisplay().workAreaSize;
    const notificationWidth = 300;
    const notificationHeight = 100;
    const margin = 10;

    notifications.forEach((win, i) => {
        const yPosition = margin + i * (notificationHeight + margin);
        win.setBounds({
            x: width - notificationWidth - margin,
            y: yPosition,
            width: notificationWidth,
            height: notificationHeight,
        });
    });
}

ipcMain.on('close-notification', (event, id) => {
    const win = notifications.find((n) => n.__notificationId === id);
    if (win) {
        // TODO: Set message seen status to true;
        win.close();
    }
});

ipcMain.on('show-notification', (event, data) => {
    showPersistentNotification(data.sender, data.message, data.messageId);
});

/* ------------------------------------ */

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
        mainWindow.loadFile('public/ask-name/ask-name.html');
    } else {
        mainWindow.loadFile('public/main/index.html');
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.send('user-data', { user });
        });
    }
});

ipcMain.on('save-user-data', async (event, { name, host }) => {
    const user = await userManager.saveUser({
        name,
        host,
    });

    if (user) {
        await mainWindow.loadFile('public/main/index.html');
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.send('user-data', { user });
        });
    } else {
        await mainWindow.loadFile('public/ask-name/ask-name.html');
    }
});

ipcMain.on('logout', async () => {
    await userManager.deleteUser();
    await mainWindow.loadFile('public/ask-name/ask-name.html');
});
