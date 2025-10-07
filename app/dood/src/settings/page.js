const { BrowserWindow } = require('electron');

function showSettingsWindow() {
    win = new BrowserWindow({
        width: 600,
        height: 400,
        backgroundColor: 'gray',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    win.loadFile('src/settings/index.html');
    return win;
}

module.exports = { showSettingsWindow };
