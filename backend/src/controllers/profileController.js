const Profile = require('../models/Profile');
const User = require('../models/User');

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
    const { phone, avatar, bio, skillLevel, ageRange, state, city, zipCode, availability, playStyle, latitude, longitude, name } =
      req.body;

    if (name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }

    let location;
    if (latitude !== undefined || longitude !== undefined) {
      const latNum = Number(latitude);
      const lngNum = Number(longitude);

      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        return res.status(400).json({ success: false, message: 'latitude and longitude must be numbers' });
      }
      if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        return res.status(400).json({ success: false, message: 'latitude/longitude are out of range' });
      }

      location = { type: 'Point', coordinates: [lngNum, latNum] };
    }

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
      location,
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

// @desc    Upload profile avatar
// @route   POST /api/profile/me/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    let profile = await Profile.findOne({ user: req.user._id });
    if (profile) {
      profile.avatar = avatarUrl;
      await profile.save();
    } else {
      profile = await Profile.create({ user: req.user._id, avatar: avatarUrl, profileComplete: false });
    }

    res.status(200).json({ success: true, message: 'Avatar uploaded successfully', avatar: avatarUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMyProfile, updateMyProfile, getProfileByUserId, deleteMyProfile, uploadAvatar };
