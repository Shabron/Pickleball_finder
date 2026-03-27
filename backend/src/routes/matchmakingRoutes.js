const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { getNearbyPlayers } = require('../controllers/matchmakingController');

// GET /api/matchmaking/nearby — find nearby players
router.get('/nearby', protect, getNearbyPlayers);

module.exports = router;

