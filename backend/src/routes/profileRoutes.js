const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyProfile, updateMyProfile, getProfileByUserId, deleteMyProfile } = require('../controllers/profileController');

// GET /api/profile/me — get my profile
router.get('/me', protect, getMyProfile);

// PUT /api/profile/me — create or update my profile
router.put('/me', protect, updateMyProfile);

// POST /api/profile/me — alias for create/update my profile
router.post('/me', protect, updateMyProfile);

// DELETE /api/profile/me — delete my profile
router.delete('/me', protect, deleteMyProfile);

// GET /api/profile/:userId — view another user's profile
router.get('/:userId', protect, getProfileByUserId);

module.exports = router;
