const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const initSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*', // For development, allow all origins. Adjust for production
      methods: ['GET', 'POST'],
    },
  });

  // Middleware for authenticating socket connections using JWT
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id; // Attach user ID to the socket
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (Socket ID: ${socket.id})`);

    // Let the user join a room specifically for them so they can receive their private events
    socket.join(socket.userId);

    // Join a specific conversation room (optional, depending on architecture)
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Handle sending message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, recipientId } = data;
        const senderId = socket.userId;

        // Ensure conversation exists or validate participants
        let conversation = await Conversation.findById(conversationId);
        
        // If no conversationId is passed but recipientId is passed, maybe create one?
        // Let's assume conversationId is required for now.
        if (!conversation) {
          // Check if a conversation between these two already exists
          conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] }
          });

          if (!conversation) {
            conversation = new Conversation({
              participants: [senderId, recipientId],
            });
          }
        }

        // Save message
        const message = new Message({
          conversationId: conversation._id,
          senderId,
          content,
        });
        await message.save();

        // Update conversation's last message and updatedAt
        conversation.lastMessage = message._id;
        conversation.updatedAt = Date.now();
        await conversation.save();

        // The socket event to emit to the recipient.
        // We emit to the recipient's user room and the sender's user room
        // so multiple devices for the same user get the event.
        io.to(recipientId).emit('receive_message', message);
        io.to(senderId).emit('receive_message', message);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle reading a message
    socket.on('mark_as_read', async (data) => {
      try {
        const { messageId, conversationId, senderId } = data;
        const message = await Message.findById(messageId);
        
        if (message && message.senderId.toString() !== socket.userId) {
          message.isRead = true;
          message.readAt = Date.now();
          await message.save();

          // Emit to the original sender that their message was read
          io.to(message.senderId.toString()).emit('message_read', {
            messageId: message._id,
            conversationId,
            readAt: message.readAt
          });
        }
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

module.exports = initSocket;
