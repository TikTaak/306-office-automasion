const { Server } = require('socket.io')
const chatSocket = require('./chat.socket')

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" }
  })

  io.on('connection', (socket) => {
    console.log('✅ کاربر وصل شد')

    // ماژول چت
    chatSocket(io, socket)

    socket.on('disconnect', () => {
      console.log('❌ کاربر خارج شد')
    })
  })
}

module.exports = { initSocket }
