const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { reportUser, blockUser, unblockUser, getBlockedUsers } = require('../controllers/safetyController');

// POST /api/safety/report — report a user
router.post('/report', protect, reportUser);

// GET /api/safety/blocked — list my blocked users
router.get('/blocked', protect, getBlockedUsers);

// POST /api/safety/block/:userId — block a user
router.post('/block/:userId', protect, blockUser);

// DELETE /api/safety/block/:userId — unblock a user
router.delete('/block/:userId', protect, unblockUser);

module.exports = router;
