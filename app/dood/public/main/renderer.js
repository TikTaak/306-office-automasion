const { ipcRenderer } = require('electron');
const { io } = require('socket.io-client');
const axios = require('axios');

const statusEl = document.getElementById('server-status');
const messagesEl = document.getElementById('messages');
const messagesInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendButton');
const sendMessageForm = document.getElementById('messageForm');
const logoutBtn = document.getElementById('logout');
const messageList = document.getElementById('message-list');

ipcRenderer.on('user-data', (event, data) => {
    document.getElementById('username').innerHTML = data.user.name;
    const user = data.user;

    const socket = io(user.host, {
        reconnection: true,
        reconnectionAttempts: 50,
        reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
        socket.emit('user_online', user.id);
        statusEl.innerText = '✅ - Connected.';
    });

    socket.on('online_users', async (users) => {
        document.getElementById('online-users').innerHTML = null;

        console.log(users);

        users.forEach(async (onlineUserId) => {
            //? elemnt is online user id
            let senderName = null;

            await axios
                .get(`${user.host}/api/users/${onlineUserId}`, {
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
            if (user.id != onlineUserId) {
                const htmlContent = `
                    <label class="online-users_user-container">
                        <input type="radio" id="${onlineUserId}" name="online-users" value="${onlineUserId}">
                        <div class="green-ball"></div><span class="online-user-name">${senderName}</span>
                    </label>
                    `;
                document.getElementById('online-users').innerHTML +=
                    htmlContent;
            }
        });
    });

    socket.on('disconnect', () => {
        statusEl.innerText = '❌ - Disconnected.';
    });

    socket.on('message', async (data) => {
        console.log(data);

        let senderName;
        if (data.toUserId == user.id || data.toUserId == data.toUserId) {
            await axios
                .get(`${user.host}/api/users/${data.toUserId}`, {
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
            if (data.toUserId == user.id) {
                ipcRenderer.send('show-notification', {
                    sender: senderName + ' : ',
                    message: data.text,
                    messageId: data.id,
                });

                messageList.innerHTML =
                    `
                    <div class="message sent-message">
                        <span class="message-sender-name">${'You'}</span>
                        <span class="message-text">${data.text}</span>
                        <span class="message-time">${data.time}</span>

                    </div>;
                    ` + messageList.innerHTML;
            } else {
                messageList.innerHTML =
                    `
                    <div class="message recived-message">
                        <span class="message-sender-name">${senderName}</span>
                        <span class="message-text">${data.text}</span>
                        <span class="message-time">${data.time}</span>
                    </div>;
                    ` + messageList.innerHTML;
            }
        }
    });

    logoutBtn.addEventListener('click', () => {
        ipcRenderer.send('logout');
    });

    sendBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        let targetUserId;

        if (messagesInput.value) {
            const selectedRadio = document.querySelector(
                'input[name="online-users"]:checked',
            );
            if (selectedRadio) {
                targetUserId = selectedRadio.id;
            } else {
                alert('Please choose one person !');
                return;
            }

            socket.emit('server-message', {
                text: messagesInput.value,
                fromUserId: user.id,
                toUserId: parseInt(targetUserId),
            });
            messagesInput.value = '';
        }
    });
});
