const Rating = require('../models/Rating');
const Profile = require('../models/Profile');
const Conversation = require('../models/Conversation');

const RATING_TAGS = ['Great partner', 'Reliable', 'Skilled', 'Good communicator', 'No-show', 'Poor communication'];

// Recompute and persist the denormalized avgRating/ratingCount on the rated
// user's Profile so profile/matchmaking reads don't need a live join.
const recomputeProfileRating = async (ratedUserId) => {
  const [agg] = await Rating.aggregate([
    { $match: { ratedUser: ratedUserId } },
    { $group: { _id: '$ratedUser', avgRating: { $avg: '$stars' }, ratingCount: { $sum: 1 } } },
  ]);

  await Profile.findOneAndUpdate(
    { user: ratedUserId },
    {
      avgRating: agg ? Math.round(agg.avgRating * 10) / 10 : 0,
      ratingCount: agg ? agg.ratingCount : 0,
    }
  );
};

// @desc    Rate a player (upsert — rate again to update your existing rating)
// @route   PUT /api/ratings/:userId
// @access  Private
const rateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { stars, tags, comment, conversationId } = req.body;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot rate yourself' });
    }

    const starsNum = Number(stars);
    if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
      return res.status(400).json({ success: false, message: 'stars must be an integer between 1 and 5' });
    }
    if (tags && (!Array.isArray(tags) || tags.some((t) => !RATING_TAGS.includes(t)))) {
      return res.status(400).json({ success: false, message: 'Invalid tags' });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
      status: 'accepted',
    });
    if (!conversation) {
      return res.status(403).json({ success: false, message: 'You can only rate players you have an accepted connection with' });
    }

    await Rating.findOneAndUpdate(
      { rater: req.user._id, ratedUser: userId },
      { stars: starsNum, tags: tags || [], comment, conversationId: conversationId || conversation._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await recomputeProfileRating(userId);

    return res.status(200).json({ success: true, message: 'Rating saved' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a player's aggregate rating + my own existing rating, if any
// @route   GET /api/ratings/:userId
// @access  Private
const getRating = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findOne({ user: userId }, 'avgRating ratingCount');
    const myRating = await Rating.findOne({ rater: req.user._id, ratedUser: userId });

    return res.status(200).json({
      success: true,
      avgRating: profile?.avgRating || 0,
      ratingCount: profile?.ratingCount || 0,
      myRating: myRating
        ? { stars: myRating.stars, tags: myRating.tags, comment: myRating.comment }
        : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { rateUser, getRating };
