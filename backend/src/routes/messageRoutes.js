const express = require('express');
const { getConversations, getMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/:conversationId', protect, getMessages);

module.exports = router;
