const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { registerPushToken, removePushToken } = require('../controllers/userController');

// Placeholder routes — wire up controllers as needed
router.get('/', (req, res) => {
  res.json({ message: 'User routes working' });
});

// POST /api/users/push-token
router.post('/push-token', protect, registerPushToken);

// DELETE /api/users/push-token
router.delete('/push-token', protect, removePushToken);

module.exports = router;
