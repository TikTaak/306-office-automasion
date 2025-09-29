const { ipcRenderer } = require('electron');
const { io } = require('socket.io-client');
const axios = require('axios');

const statusEl = document.getElementById('server-status');
const messagesEl = document.getElementById('messages');
const messagesInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendButton');
const logoutBtn = document.getElementById('logout');

let thisUser = null;

logoutBtn.addEventListener('click', () => {
    ipcRenderer.send('logout');
});

ipcRenderer.on('user-data', async (event, data) => {
    // console.log(data);
    document.getElementById('username').innerHTML =
        data.user.name + ' - ' + data.user.id;

    thisUser = data.user;
});

const socket = io('http://localhost:3000', {
    reconnection: true,
    reconnectionAttempts: 50,
    reconnectionDelay: 2000,
});

sendBtn.addEventListener('click', async () => {
    let targetUserId;
    if (messagesInput.value) {
        const selectedRadio = document.querySelector(
            'input[name="choices"]:checked',
        );
        if (selectedRadio) {
            targetUserId = selectedRadio.id;
        } else {
            alert('لطفاً یکی از کاربران رو انتخاب کن!');
        }

        socket.emit('server-message', {
            text: messagesInput.value,
            fromUserId: thisUser.id,
            toUserId: await parseInt(targetUserId),
        });
        messagesInput.value = '';
    }
});

socket.on('connect', () => {
    socket.emit('user_online', thisUser.id);
    statusEl.innerText = '✅ - Connected.';
    console.log('وصل شد به سرور');
});

socket.on('online_users', (users) => {
    document.getElementById('online-users').innerHTML = null;

    users.forEach(async (element) => {
        //? elemnt is online user id
        let senderName;

        await axios
            .get(`http://localhost:3000/api/users/${element}`, {
                proxy: false,
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then((res) => {
                console.log('Response:', res.data);
                senderName = res.data.name;
            })
            .catch((err) => {
                console.error('Error:', err);
            });

        const htmlContent = `
            <div class="online-user" style=${
                element == thisUser.id ? 'background:green;' : ''
            }>
                <input type="radio" id="${element}" name="choices" value="1">
                <label for="option1">${senderName}</label><br>
            </div>
        `;
        document.getElementById('online-users').innerHTML += htmlContent;
    });

    // console.log(' 🔔 - Online users: ', users);
});

socket.on('disconnect', () => {
    statusEl.innerText = '❌ - Disconnected.';
    console.log('قطع شد از سرور');
});

socket.on('message', async (data) => {
    let senderName;
    if (data.fromUserId != thisUser.id) {
        if (data.toUserId == thisUser.id) {
            await axios
                .get(`http://localhost:3000/api/users/${data.toUserId}`, {
                    proxy: false,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                .then((res) => {
                    console.log('Response:', res.data);
                    senderName = res.data.name;
                })
                .catch((err) => {
                    console.error('Error:', err);
                });
            console.log(senderName);
            ipcRenderer.send('show-notification', {
                sender: senderName + ' : ',
                message: data.text,
                messageId: data.id,
            });

            const li = document.createElement('li');
            li.innerText = ' 📩 - message: ' + JSON.stringify(data);
            messagesEl.appendChild(li);
        }
        const p = document.createElement('li');
        p.innerText = ' 📩 - Server message: ' + JSON.stringify(data);
        messagesEl.appendChild(p);
    }
});
