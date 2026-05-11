const Profile = require('../models/Profile');
const Conversation = require('../models/Conversation');

// @desc    Find nearby players (by profile location)
// @route   GET /api/matchmaking/nearby?lat=&lng=&radiusKm=&skillLevel=&playStyle=&limit=
// @access  Private
const getNearbyPlayers = async (req, res) => {
  try {
    const { lat, lng, radiusKm = '25', skillLevel, playStyle, limit = '50' } = req.query;

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusKmNum = Number(radiusKm);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));

    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      return res.status(400).json({ success: false, message: 'lat and lng are required and must be numbers' });
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ success: false, message: 'lat/lng are out of range' });
    }
    if (Number.isNaN(radiusKmNum) || radiusKmNum <= 0) {
      return res.status(400).json({ success: false, message: 'radiusKm must be a positive number' });
    }

    const maxDistanceMeters = radiusKmNum * 1000;

    const baseQuery = {
      user: { $ne: req.user._id },
    };
    if (skillLevel) baseQuery.skillLevel = skillLevel;
    if (playStyle) baseQuery.playStyle = playStyle;

    const results = await Profile.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lngNum, latNum] },
          distanceField: 'distanceMeters',
          spherical: true,
          maxDistance: maxDistanceMeters,
          query: baseQuery,
          key: 'location',
        },
      },
      { $sort: { distanceMeters: 1 } },
      { $limit: limitNum },
    ]);

    // Hydrate + populate user details for client display
    const profiles = await Profile.populate(results, { path: 'user', select: 'name email avatar' });

    // Fetch conversation statuses
    const profileUserIds = profiles.map(p => p.user._id);
    const conversations = await Conversation.find({
      participants: { $all: [req.user._id] },
    });

    // Create a map of userId -> connectionStatus
    const statusMap = {};
    conversations.forEach(conv => {
      const otherParticipant = conv.participants.find(p => p.toString() !== req.user._id.toString());
      if (otherParticipant) {
        if (conv.status === 'accepted') {
          statusMap[otherParticipant.toString()] = 'accepted';
        } else if (conv.status === 'pending') {
          statusMap[otherParticipant.toString()] = 
            (conv.initiator && conv.initiator.toString() === req.user._id.toString()) 
            ? 'pending_sent' 
            : 'pending_received';
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: profiles.map((p) => ({
        ...p,
        distanceKm: p.distanceMeters != null ? Math.round((p.distanceMeters / 1000) * 10) / 10 : null,
        connectionStatus: statusMap[p.user._id.toString()] || 'none',
        conversationId: conversations.find(c => c.participants.some(par => par.toString() === p.user._id.toString()))?._id || null,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getNearbyPlayers };

