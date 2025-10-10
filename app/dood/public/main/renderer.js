const { io } = require('socket.io-client');
const { ipcRenderer } = require('electron');
const axios = require('axios');

const statusEl = document.getElementById('server-status');
const messagesEl = document.getElementById('messages');
const messagesInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendButton');
const sendMessageForm = document.getElementById('messageForm');
const logoutBtn = document.getElementById('logout');
const messageList = document.getElementById('message-list');

class socketConnection {
    static instance;
    user = null;

    constructor() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = this;
        this._initUser();
    }
    getInstance() {
        return this;
    }

    _initUser() {
        ipcRenderer.on('user-data', async (event, data) => {
            document.getElementById('username').innerHTML = data.user.name;
            this.user = await data.user;
            this._initSocket();
            this._initButtonsListeners();
        });
    }

    _initSocket() {
        console.log(this.user);

        this.socket = io(this.user.host, {
            reconnection: true,
            reconnectionAttempts: 50,
            reconnectionDelay: 2000,
        });

        this.socket.on('connect', () => {
            this.socket.emit('user_online', this.user.id);
            statusEl.innerText = '✅ - Connected.';
        });

        this.socket.on('online_users', async (users) => {
            document.getElementById('online-users').innerHTML = null;
            console.log(users);

            users.forEach(async (onlineUserId) => {
                let senderName = null;

                await axios
                    .get(`${this.user.host}/api/users/${onlineUserId}`, {
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
                if (this.user.id != onlineUserId) {
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

        this.socket.on('disconnect', () => {
            statusEl.innerText = '❌ - Disconnected.';
        });

        this.socket.on('message', async (data) => {
            console.log(data);

            let senderName;
            if (
                data.toUserId == this.user.id ||
                data.toUserId == data.toUserId
            ) {
                await axios
                    .get(`${this.user.host}/api/users/${data.toUserId}`, {
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
                        console.error('Error:', err.data);
                    });
                if (data.toUserId == this.user.id) {
                    // The message sent for this user
                    ipcRenderer.send('show-notification', {
                        sender: senderName + ' : ',
                        message: data.text,
                        messageId: data.id,
                    });

                    messageList.innerHTML =
                        `
                            <div class="message recived-message">
                                <span class="message-sender-name">${senderName}</span>
                                <span class="message-text">${data.text}</span>
                                <span class="message-time">${data.time}</span>
        
                            </div>;
                            ` + messageList.innerHTML;
                } else {
                    messageList.innerHTML =
                        `
                            <div class="message sent-message">
                                <span class="message-sender-name">${'You'}</span>
                                <span class="message-text">${data.text}</span>
                                <span class="message-time">${data.time}</span>
                            </div>;
                            ` + messageList.innerHTML;
                }
            }
        });
    }

    _initButtonsListeners() {
        logoutBtn.addEventListener('click', () => {
            this.socket.disconnect();
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

                this.socket.emit('server-message', {
                    text: messagesInput.value,
                    fromUserId: this.user.id,
                    toUserId: parseInt(targetUserId),
                });
                messagesInput.value = '';
            }
        });
    }
}

const singletonsocketConnection = new socketConnection();
