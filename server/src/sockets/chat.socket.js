const { createMessage } = require('../services/message.service');

module.exports =  (io, socket) => {
    socket.on('server-message', async (data) => {
        console.log(' 📩 - Message received:', data);
        let message = await createMessage({
            text: data.text,
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
        });

        io.emit('message', {...message});
    });
};
