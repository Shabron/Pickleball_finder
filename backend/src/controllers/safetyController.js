const User = require('../models/User');
const Report = require('../models/Report');
const { attachAvatarsToUsers } = require('../utils/attachAvatars');

const REPORT_REASONS = ['harassment', 'inappropriate_behavior', 'fake_profile', 'no_show', 'safety_concern', 'other'];

// @desc    Report a user, optionally blocking them at the same time
// @route   POST /api/safety/report
// @access  Private
const reportUser = async (req, res) => {
  try {
    const { reportedUserId, reason, details, context, alsoBlock } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ success: false, message: 'reportedUserId and reason are required' });
    }
    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Invalid reason' });
    }
    if (reportedUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself' });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      reason,
      details,
      context,
    });

    if (alsoBlock) {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: reportedUserId } });
    }

    return res.status(201).json({ success: true, message: 'Report submitted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Block a user
// @route   POST /api/safety/block/:userId
// @access  Private
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: userId } });

    return res.status(200).json({ success: true, message: 'User blocked' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unblock a user
// @route   DELETE /api/safety/block/:userId
// @access  Private
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: userId } });
    return res.status(200).json({ success: true, message: 'User unblocked' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List my blocked users
// @route   GET /api/safety/blocked
// @access  Private
const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'name email').lean();
    const blockedUsers = user.blockedUsers || [];
    await attachAvatarsToUsers(blockedUsers);
    return res.status(200).json({ success: true, data: blockedUsers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { reportUser, blockUser, unblockUser, getBlockedUsers };
