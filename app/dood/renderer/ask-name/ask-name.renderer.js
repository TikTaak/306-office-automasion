const { ipcRenderer } = require('electron');
const axios = require('axios');

function saveName() {
    const name = document.getElementById('name').value.trim();
    const host = document.getElementById('host').value.trim();

    if (name && host) {
        ipcRenderer.send('save-user-data', { name, host });
    }
}

function serviceAvalableScenario() {
    const hostStatusLable = document.getElementById('host-status-lable');
    hostStatusLable.textContent = ' - Service Avalable !';
    hostStatusLable.style.color = 'green';
}
function serviceNotAvalableScenario() {
    const hostStatusLable = document.getElementById('host-status-lable');
    hostStatusLable.textContent = ' - Service is not Avalable !';
    hostStatusLable.style.color = 'red';
}
function pingServiceScenario() {
    const hostStatusLable = document.getElementById('host-status-lable');
    hostStatusLable.textContent = ' - thinking ...';
    hostStatusLable.style.color = 'rgb(160, 131, 4)';
}

async function pingService() {
    await axios
        .get(`${document.getElementById('host').value.trim()}/api/ping/`, {
            proxy: false,
            timeout: 3000,
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((res) => {
            if (res.data.status == 200) {
                serviceAvalableScenario();
            }
        })
        .catch((err) => {
            serviceNotAvalableScenario();
        });
}

pingService();

document.getElementById('host').addEventListener('input', async () => {
    await pingServiceScenario();
    await pingService();
    console.log('element data changed');
});
