const Profile = require('../models/Profile');

// @desc    Get my profile
// @route   GET /api/profile/me
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate('user', 'name email');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found. Please create your profile.' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create or update my profile
// @route   PUT /api/profile/me
// @access  Private
const updateMyProfile = async (req, res) => {
  try {
    const { phone, avatar, bio, skillLevel, ageRange, state, city, zipCode, availability, playStyle } = req.body;

    const profileFields = {
      user: req.user._id,
      phone,
      avatar,
      bio,
      skillLevel,
      ageRange,
      state,
      city,
      zipCode,
      availability,
      playStyle,
      profileComplete: true,
    };

    // Remove undefined fields so we don't overwrite with undefined
    Object.keys(profileFields).forEach((key) => {
      if (profileFields[key] === undefined) delete profileFields[key];
    });

    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      // Update existing
      profile = await Profile.findOneAndUpdate({ user: req.user._id }, { $set: profileFields }, { new: true }).populate(
        'user',
        'name email'
      );
    } else {
      // Create new
      profile = await Profile.create(profileFields);
      profile = await Profile.findById(profile._id).populate('user', 'name email');
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get any user's profile by user ID
// @route   GET /api/profile/:userId
// @access  Private
const getProfileByUserId = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate('user', 'name email');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete my profile
// @route   DELETE /api/profile/me
// @access  Private
const deleteMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOneAndDelete({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMyProfile, updateMyProfile, getProfileByUserId, deleteMyProfile };
