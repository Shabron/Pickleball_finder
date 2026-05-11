const express = require('express');
const { getConversations, getMessages, sendMessage, markMessagesAsRead, acceptRequest } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/:conversationId', protect, getMessages);
router.post('/', protect, sendMessage);
router.put('/:conversationId/read', protect, markMessagesAsRead);
router.put('/:conversationId/accept', protect, acceptRequest);

module.exports = router;
