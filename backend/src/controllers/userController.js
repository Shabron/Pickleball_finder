const User = require('../models/User');

// @desc    Register (or refresh) this device's push notification token
// @route   POST /api/users/push-token
// @access  Private
const registerPushToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    console.log(`[registerPushToken] Request from user ${req.user._id}: platform=${platform}, token=${token ? token.slice(0, 12) + '...' : token}`);

    if (!token || !platform || !['ios', 'android'].includes(platform)) {
      console.warn('[registerPushToken] Rejected — missing/invalid token or platform');
      return res.status(400).json({ success: false, message: 'Please provide a valid token and platform (ios|android)' });
    }

    // A device may have previously registered this token under a different
    // account (e.g. logged out and a different user signed in) — make sure
    // it only ever belongs to one user at a time.
    const pulled = await User.updateMany(
      { 'pushTokens.token': token },
      { $pull: { pushTokens: { token } } }
    );
    if (pulled.modifiedCount) {
      console.log(`[registerPushToken] Removed this token from ${pulled.modifiedCount} other user doc(s) first`);
    }

    await User.updateOne(
      { _id: req.user._id },
      { $push: { pushTokens: { token, platform, updatedAt: new Date() } } }
    );
    console.log(`[registerPushToken] Token saved for user ${req.user._id}`);

    res.status(200).json({ success: true, message: 'Push token registered' });
  } catch (error) {
    console.error('[registerPushToken] Failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove this device's push notification token (e.g. on logout)
// @route   DELETE /api/users/push-token
// @access  Private
const removePushToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Please provide a token' });
    }

    await User.updateOne(
      { _id: req.user._id },
      { $pull: { pushTokens: { token } } }
    );

    res.status(200).json({ success: true, message: 'Push token removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerPushToken, removePushToken };
