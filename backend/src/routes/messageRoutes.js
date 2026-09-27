const express = require('express');
const {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  acceptRequest,
  declineRequest,
  cancelRequest,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/:conversationId', protect, getMessages);
router.post('/', protect, sendMessage);
router.put('/:conversationId/read', protect, markMessagesAsRead);
router.put('/:conversationId/accept', protect, acceptRequest);
router.put('/:conversationId/decline', protect, declineRequest);
router.delete('/:conversationId', protect, cancelRequest);

module.exports = router;
