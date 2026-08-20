const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { rateUser, getRating } = require('../controllers/ratingController');

// PUT /api/ratings/:userId — rate a player (upsert)
router.put('/:userId', protect, rateUser);

// GET /api/ratings/:userId — get a player's aggregate rating + my own rating
router.get('/:userId', protect, getRating);

module.exports = router;
