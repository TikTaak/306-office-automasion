const { Server } = require('socket.io');
const chatSocket = require('./chat.socket');

const onlineUsers = new Map(); // key: userId, value: socket.id

function initSocket(server) {
    const io = new Server(server, {
        cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
        console.log('✅ - User connected:', socket.id);

        socket.on('user_online', (userId) => {

            onlineUsers.set(userId, socket.id);
            console.log(onlineUsers);
            
            console.log(`ℹ️ User ${userId} is online`);
            io.emit('online_users', Array.from(onlineUsers.keys()));
        });

        chatSocket(io, socket, onlineUsers);

        socket.on('disconnect', async () => {
            for (let [userId, sId] of onlineUsers.entries()) {
                if (sId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`❌ - User ${userId} disconnected`);
                    break;
                }
            }
            io.emit('online_users', Array.from(onlineUsers.keys()));
        });
    });
}

module.exports = { initSocket };
