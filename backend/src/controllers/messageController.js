const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/push');
const { attachAvatarsToUsers } = require('../utils/attachAvatars');
const { viewStatus, isInCooldown } = require('../utils/connectionStatus');

// @desc    Get all conversations for the logged-in user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find conversations where user is a participant
    const all = await Conversation.find({ participants: userId })
      .populate('participants', 'name email profileComplete')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .lean();

    // Hide declined/withdrawn threads (the sender keeps seeing "waiting"
    // during the cool-down — see utils/connectionStatus).
    const conversations = all
      .map((c) => ({ ...c, viewStatus: viewStatus(c, userId) }))
      .filter((c) => c.viewStatus !== 'none');

    // Unread counts for every conversation in one aggregate (was N queries).
    const unreadRows = conversations.length
      ? await Message.aggregate([
          {
            $match: {
              conversationId: { $in: conversations.map((c) => c._id) },
              senderId: { $ne: userId },
              isRead: false,
            },
          },
          { $group: { _id: '$conversationId', n: { $sum: 1 } } },
        ])
      : [];
    const unreadBy = new Map(unreadRows.map((r) => [r._id.toString(), r.n]));

    const conversationsWithUnread = conversations.map((c) => ({
      ...c,
      unreadCount: unreadBy.get(c._id.toString()) || 0,
    }));

    // Batch-attach avatars (from Profile) to every participant across all
    // conversations in one query, rather than one lookup per conversation.
    const everyone = conversationsWithUnread.flatMap((c) => c.participants);
    await attachAvatarsToUsers(everyone);

    // Level + city so request rows can say who the person is.
    const others = everyone.filter((u) => u && u._id.toString() !== userId.toString());
    if (others.length) {
      const profs = await Profile.find(
        { user: { $in: others.map((u) => u._id) } },
        'user skillLevel city state'
      ).lean();
      const byUser = new Map(profs.map((p) => [p.user.toString(), p]));
      others.forEach((u) => {
        const pr = byUser.get(u._id.toString());
        if (pr) {
          u.skillLevel = pr.skillLevel;
          u.city = pr.city;
          u.state = pr.state;
        }
      });
    }

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

    const status = viewStatus(conversation, userId);
    res.status(200).json({
      success: true,
      data: status === 'none' ? [] : messages,
      conversationStatus: conversation.status,
      initiator: conversation.initiator,
      viewStatus: status,
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

    const iBlockedThem = (req.user.blockedUsers || []).some((id) => id.toString() === receiverId);
    const theyBlockedMe = iBlockedThem
      ? false
      : await User.exists({ _id: receiverId, blockedUsers: senderId });
    if (iBlockedThem || theyBlockedMe) {
      return res.status(403).json({ success: false, message: "You can't message this user." });
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
    } else if (conversation.status === 'rejected') {
      const senderStarted = conversation.initiator && conversation.initiator.toString() === senderId.toString();
      if (senderStarted && isInCooldown(conversation)) {
        // Silently declined: behave as if the request is still waiting.
        return res.status(201).json({ success: true, data: null, conversationId: conversation._id });
      }
      // Cool-down over (or the decliner reaches out) — start a fresh request.
      await Message.deleteMany({ conversationId: conversation._id });
      conversation.status = 'pending';
      conversation.initiator = senderId;
      conversation.declinedAt = undefined;
      conversation.initiatorHidden = false;
      isNewRequest = true;
    } else if (conversation.status === 'pending' && senderId.toString() !== conversation.initiator.toString()) {
      // Prevent the receiver from sending messages before accepting
      return res.status(403).json({ success: false, message: 'Please accept the request to send messages' });
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
          await sendPushNotification(receiverId, {
            title: 'New Partner Request!',
            body: `${senderName} wants to connect with you.`,
            data: { type: 'request_sent', referenceId: conversation._id.toString() },
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
          await sendPushNotification(receiverId, {
            title: 'New Message',
            body: `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            data: { type: 'new_message', referenceId: conversation._id.toString() },
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
        await sendPushNotification(initiatorId, {
          title: "It's a Match! 🎉",
          body: `${accepterName} accepted your request.`,
          data: { type: 'request_accepted', referenceId: conversation._id.toString() },
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

// @desc    Decline a connection request (the sender is NOT notified)
// @route   PUT /api/messages/:conversationId/decline
// @access  Private
const declineRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation || !conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(404).json({ success: false, message: 'Conversation not found or not authorized' });
    }
    if (conversation.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Conversation is not pending' });
    }
    if (conversation.initiator && conversation.initiator.toString() === userId.toString()) {
      return res.status(403).json({ success: false, message: 'Use cancel for your own request' });
    }
    conversation.status = 'rejected';
    conversation.declinedAt = new Date();
    await conversation.save();
    await Notification.deleteMany({ recipient: userId, referenceId: conversation._id, type: 'request_sent' });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel (withdraw) a request I sent
// @route   DELETE /api/messages/:conversationId
// @access  Private
const cancelRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation || !conversation.initiator || conversation.initiator.toString() !== userId.toString()) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (conversation.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'Request was already accepted' });
    }
    if (conversation.status === 'rejected') {
      // Keep the record so the 30-day cool-down still applies.
      conversation.initiatorHidden = true;
      await conversation.save();
    } else {
      await Promise.all([
        Message.deleteMany({ conversationId: conversation._id }),
        Notification.deleteMany({ referenceId: conversation._id, type: 'request_sent' }),
        Conversation.deleteOne({ _id: conversation._id }),
      ]);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  acceptRequest,
  declineRequest,
  cancelRequest,
};
