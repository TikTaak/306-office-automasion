module.exports = (io, socket) => {
    socket.on('message', (data) => {
        console.log('📩 دریافت پیام:', data);

        io.emit('message', {
            type: 'chat',
            payload: {
                text: data.payload.text,
                user: data.payload.user || 'ناشناس',
                time: new Date().toISOString(),
            },
        });
    });
};
