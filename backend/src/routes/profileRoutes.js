const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyProfile, updateMyProfile, getProfileByUserId, deleteMyProfile, uploadAvatar, reverseGeocode } = require('../controllers/profileController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Git doesn't track empty directories, so uploads/ never actually exists in
// a fresh deploy (it's just not in the repo) — multer's diskStorage throws
// ENOENT trying to write into a directory that isn't there. Create it once
// at startup so this works regardless of what's checked out.
const UPLOADS_DIR = path.join(__dirname, '../../uploads/');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOADS_DIR);
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

// GET /api/profile/reverse-geocode — resolve GPS coords to city/state/zip
// (must be registered before the /:userId catch-all below)
router.get('/reverse-geocode', protect, reverseGeocode);

// GET /api/profile/:userId — view another user's profile
router.get('/:userId', protect, getProfileByUserId);

module.exports = router;
