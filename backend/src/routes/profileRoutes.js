const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyProfile, updateMyProfile, getProfileByUserId, deleteMyProfile, uploadAvatar } = require('../controllers/profileController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename(req, file, cb) {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5000000 } });

// GET /api/profile/me — get my profile
router.get('/me', protect, getMyProfile);

// PUT /api/profile/me — create or update my profile
router.put('/me', protect, updateMyProfile);

// POST /api/profile/me — alias for create/update my profile
router.post('/me', protect, updateMyProfile);

// POST /api/profile/me/avatar — upload profile picture
router.post('/me/avatar', protect, upload.single('avatar'), uploadAvatar);

// DELETE /api/profile/me — delete my profile
router.delete('/me', protect, deleteMyProfile);

// GET /api/profile/:userId — view another user's profile
router.get('/:userId', protect, getProfileByUserId);

module.exports = router;
