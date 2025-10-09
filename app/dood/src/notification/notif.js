const { BrowserWindow, ipcMain, screen } = require('electron');

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
/*
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
*/

module.exports = {showPersistentNotification, notifications }