const User = require('../models/User');
const Message = require('../models/Message');

const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins
    socket.on('join', async (userId) => {
      try {
        onlineUsers.set(userId, socket.id);
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          status: 'online',
          lastSeen: new Date()
        });

        io.emit('user_online', { userId, status: 'online' });
      } catch (error) {
        console.error('Error in join event:', error);
      }
    });

    // Join room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Leave room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room ${roomId}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, message, userId } = data;

        // Emit to room
        io.to(conversationId).emit('receive_message', {
          conversationId,
          message,
          userId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { conversationId, userId, name } = data;
      io.to(conversationId).emit('user_typing', {
        userId,
        name,
        conversationId
      });
    });

    // Stop typing
    socket.on('stop_typing', (data) => {
      const { conversationId, userId } = data;
      io.to(conversationId).emit('user_stopped_typing', {
        userId,
        conversationId
      });
    });

    // User disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);

      // Find and update user
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            status: 'offline',
            lastSeen: new Date()
          });
          io.emit('user_offline', { userId, status: 'offline' });
          break;
        }
      }
    });
  });
};
