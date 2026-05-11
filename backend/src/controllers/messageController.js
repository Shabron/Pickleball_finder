const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');

// @desc    Get all conversations for the logged-in user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find conversations where user is a participant
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email profileComplete')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: userId },
          isRead: false,
        });
        return {
          ...conv.toObject(),
          unreadCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      currentUserId: userId,
      data: conversationsWithUnread,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all messages for a specific conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify conversation exists and user is part of it
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name')
      .sort({ createdAt: 1 }); // Oldest first for chat history

    res.status(200).json({
      success: true,
      data: messages,
      conversationStatus: conversation.status,
      initiator: conversation.initiator,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Receiver and content are required' });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // If no conversation, create one
    let isNewRequest = false;
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        status: 'pending',
        initiator: senderId,
      });
      isNewRequest = true;
    } else {
      // Prevent the receiver from sending messages before accepting
      if (conversation.status === 'pending' && senderId.toString() !== conversation.initiator.toString()) {
        return res.status(403).json({ success: false, message: 'Please accept the request to send messages' });
      }
    }

    // Create the new message
    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
    });

    // Update conversation's last message
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    // Notification Logic
    try {
      const receiverProfile = await Profile.findOne({ user: receiverId });
      const senderProfile = await Profile.findOne({ user: senderId }).populate('user', 'name');
      const senderName = senderProfile?.user?.name || 'Someone';

      if (isNewRequest) {
        if (receiverProfile?.notificationSettings?.requests !== false) {
          await Notification.create({
            recipient: receiverId,
            type: 'request_sent',
            title: 'New Partner Request!',
            body: `${senderName} wants to connect with you.`,
            referenceId: conversation._id,
          });
        }
      } else if (conversation.status === 'accepted') {
        if (receiverProfile?.notificationSettings?.messages !== false) {
          await Notification.create({
            recipient: receiverId,
            type: 'new_message',
            title: 'New Message',
            body: `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            referenceId: conversation._id,
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to send notification', notifErr);
    }

    res.status(201).json({
      success: true,
      data: newMessage,
      conversationId: conversation._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:conversationId/read
// @access  Private
const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify conversation exists and user is part of it
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(404).json({ success: false, message: 'Conversation not found or not authorized' });
    }

    // Mark all unread messages sent by the OTHER person as read
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept a connection request
// @route   PUT /api/messages/:conversationId/accept
// @access  Private
const acceptRequest = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(404).json({ success: false, message: 'Conversation not found or not authorized' });
    }

    if (conversation.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Conversation is not pending' });
    }

    if (conversation.initiator && conversation.initiator.toString() === userId.toString()) {
      return res.status(403).json({ success: false, message: 'Initiator cannot accept their own request' });
    }

    conversation.status = 'accepted';
    await conversation.save();

    // Notification Logic
    try {
      const initiatorId = conversation.initiator;
      const initiatorProfile = await Profile.findOne({ user: initiatorId });
      const accepterProfile = await Profile.findOne({ user: userId }).populate('user', 'name');
      const accepterName = accepterProfile?.user?.name || 'Someone';

      if (initiatorProfile?.notificationSettings?.requests !== false) {
        await Notification.create({
          recipient: initiatorId,
          type: 'request_accepted',
          title: "It's a Match! 🎉",
          body: `${accepterName} accepted your request.`,
          referenceId: conversation._id,
        });
      }
    } catch (notifErr) {
      console.error('Failed to send notification', notifErr);
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getConversations, getMessages, sendMessage, markMessagesAsRead, acceptRequest };
