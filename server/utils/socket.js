const { Server } = require('socket.io');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log('🔗 Client connected to socket:', socket.id);

      // Clients can join a room based on their userId to receive personal notifications
      socket.on('join_user_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their personal room`);
      });

      // Clients can join a role room (e.g., 'Admin', 'Worker')
      socket.on('join_role_room', (role) => {
        socket.join(role);
        console.log(`Socket ${socket.id} joined role room: ${role}`);
      });

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io is not initialized!');
    }
    return io;
  }
};
