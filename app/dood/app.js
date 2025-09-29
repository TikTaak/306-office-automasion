const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

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

    // ذخیره پنجره و id
    win.__notificationId = id;
    notifications.push(win);

    // محتوای HTML نوتیف
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

// بروزرسانی موقعیت‌ها
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

// بستن پنجره بر اساس id
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

function showNotification2() {
    new Notification({
        title: 'سلام!',
        body: 'این یک نوتیفیکیشن از Electron است.',
    }).show();
}

function readUser() {
    if (fs.existsSync(userFile)) {
        const data = fs.readFileSync(userFile);
        return JSON.parse(data);
    }
    return null;
}
function saveUser(name) {
    axios
        .post(
            'http://localhost:3000/api/users',
            {
                name,
            },
            {
                proxy: false,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
        .then((res) => {
            console.log('Response:', res.data);
            fs.writeFileSync(
                userFile,
                JSON.stringify({ name: res.data.name, id: res.data.id }),
            );
        })
        .catch((err) => {
            console.error('Error:', err);
        });
}

function deleteUser() {
    if (fs.existsSync(userFile)) {
        const data = fs.readFileSync(userFile, 'utf8');
        const obj = JSON.parse(data);

        axios
            .delete(`http://localhost:3000/api/users/${obj.id}`, {
                proxy: false,
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then((res) => {
                console.log('Response:', res.data);
                fs.writeFileSync(
                    userFile,
                    JSON.stringify({ name: res.data.name, id: res.data.id }),
                );
            })
            .catch((err) => {
                console.error('Error:', err);
            });
        fs.unlinkSync(userFile);
    }
}

ipcMain.on('save-name', (event, name) => {
    saveUser(name);
    mainWindow.loadFile('index.html');
});

ipcMain.on('logout', () => {
    deleteUser();
    mainWindow.loadFile('askName.html');
});

app.whenReady().then(() => {
    let user = readUser();

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
        mainWindow.loadFile('askName.html');
    } else {
        mainWindow.loadFile('index.html');
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.send('user-data', { user });
        });
    }
});
