const Profile = require('../models/Profile');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { computeMatchScore } = require('../utils/matchScore');
const { geocodeApprox } = require('../utils/geocode');
const { viewStatus } = require('../utils/connectionStatus');

const ZIP_REGEX = /^\d{5}$/;

// @desc    Find players — by GPS radius (default), by state/nationwide, or by exact zip code
// @route   GET /api/matchmaking/nearby?mode=nearby|state|zip&lat=&lng=&radiusKm=&state=&zipCode=&skillLevel=&playStyle=&limit=&offset=
// @access  Private
const getNearbyPlayers = async (req, res) => {
  try {
    const { mode = 'nearby', lat, lng, radiusKm = '25', state, zipCode, skillLevel, playStyle, limit = '50', offset = '0' } = req.query;

    const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
    const offsetNum = Math.max(0, Number(offset) || 0);

    const myProfile = await Profile.findOne({ user: req.user._id }, 'skillLevel playStyle');

    // Exclude both directions: users I've blocked, and users who've blocked me.
    const blockedByMe = req.user.blockedUsers || [];
    const blockedMe = await User.find({ blockedUsers: req.user._id }, '_id');
    const excludedUserIds = [req.user._id, ...blockedByMe, ...blockedMe.map((u) => u._id)];

    const baseQuery = {
      user: { $nin: excludedUserIds },
    };
    if (skillLevel) baseQuery.skillLevel = skillLevel;
    if (playStyle) baseQuery.playStyle = playStyle;

    let page;
    let hasMore;

    if (mode === 'state') {
      const filter = { ...baseQuery };
      if (state && state !== 'ALL') filter.state = state;

      const results = await Profile.find(filter)
        .sort({ createdAt: -1 })
        .skip(offsetNum)
        // Fetch one extra record to detect whether another page exists.
        .limit(limitNum + 1)
        .lean();

      hasMore = results.length > limitNum;
      page = hasMore ? results.slice(0, limitNum) : results;
    } else if (mode === 'zip') {
      if (!zipCode || !ZIP_REGEX.test(String(zipCode))) {
        return res.status(400).json({ success: false, message: 'zipCode must be a 5-digit US zip code' });
      }

      // Resolve the zip to coordinates (offline dataset) and return players
      // nearest-first from there, uncapped — an exact-zip match is almost
      // always empty for a small user base. The client splits the list into
      // "within X mi" / "further away". Unknown zips fall back to exact match.
      const center = geocodeApprox({ zipCode });
      let results;
      if (center) {
        results = await Profile.aggregate([
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [center.longitude, center.latitude] },
              distanceField: 'distanceMeters',
              spherical: true,
              query: baseQuery,
              key: 'location',
            },
          },
          { $sort: { distanceMeters: 1 } },
          { $skip: offsetNum },
          { $limit: limitNum + 1 },
        ]);
      } else {
        results = await Profile.find({ ...baseQuery, zipCode })
          .sort({ createdAt: -1 })
          .skip(offsetNum)
          .limit(limitNum + 1)
          .lean();
      }

      hasMore = results.length > limitNum;
      page = hasMore ? results.slice(0, limitNum) : results;
    } else {
      // mode === 'nearby' (default) — unchanged GPS-radius behavior.
      const latNum = Number(lat);
      const lngNum = Number(lng);
      const radiusKmNum = Number(radiusKm);

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
        { $skip: offsetNum },
        // Fetch one extra record to detect whether another page exists.
        { $limit: limitNum + 1 },
      ]);

      hasMore = results.length > limitNum;
      page = hasMore ? results.slice(0, limitNum) : results;
    }

    // Hydrate + populate user details for client display. Drop orphaned
    // profiles whose referenced user no longer exists — $geoNear (nearby
    // mode) silently excludes these since they also tend to lack a
    // `location`, but the plain find() used for state/zip search doesn't.
    // Note: avatar lives on Profile itself, not User — it's already on
    // each `page` document, nothing to populate for it here.
    const profiles = (
      await Profile.populate(page, { path: 'user', select: 'name email emailVerified' })
    ).filter((p) => p.user);

    // Fetch conversation statuses
    const conversations = await Conversation.find({
      participants: { $all: [req.user._id] },
    });

    // Create a map of userId -> connectionStatus
    const statusMap = {};
    const convMap = {};
    conversations.forEach(conv => {
      const otherParticipant = conv.participants.find(p => p.toString() !== req.user._id.toString());
      if (!otherParticipant) return;
      const status = viewStatus(conv, req.user._id);
      if (status === 'none') return;
      statusMap[otherParticipant.toString()] = status;
      convMap[otherParticipant.toString()] = conv._id;
    });

    return res.status(200).json({
      success: true,
      data: profiles.map((p) => {
        const distanceKm = p.distanceMeters != null ? Math.round((p.distanceMeters / 1000) * 10) / 10 : null;
        return {
          ...p,
          distanceKm,
          matchScore: computeMatchScore(myProfile, p, distanceKm),
          connectionStatus: statusMap[p.user._id.toString()] || 'none',
          conversationId: convMap[p.user._id.toString()] || null,
        };
      }),
      hasMore,
      // Based on the raw DB page size (before dropping orphaned profiles
      // above) so pagination stays aligned with what's actually been
      // consumed from the collection.
      nextOffset: offsetNum + page.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getNearbyPlayers };
