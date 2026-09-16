const Profile = require('../models/Profile');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const { geocodeApprox } = require('../utils/geocode');
const { computeMatchScore, haversineKm } = require('../utils/matchScore');
const zipcodes = require('zipcodes');

// @desc    Get my profile
// @route   GET /api/profile/me
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate('user', 'name email emailVerified');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found. Please create your profile.' });
    }

    const unreadNotificationsCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.status(200).json({ 
      success: true, 
      data: profile,
      unreadNotificationsCount
    });
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

    if (zipCode && !/^\d{5}$/.test(String(zipCode))) {
      return res.status(400).json({ success: false, message: 'zipCode must be a 5-digit US zip code' });
    }

    if (name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }

    const existingProfile = await Profile.findOne({ user: req.user._id });

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
    } else {
      // No precise GPS coordinates in this request. Only recompute the
      // approximate point if the zip/city/state actually changed (or this
      // is a brand-new profile) — otherwise leave `location` untouched so a
      // previously-captured precise GPS point isn't silently downgraded to
      // a coarse zip-centroid approximation on every unrelated profile edit.
      const locationFieldsChanged =
        !existingProfile ||
        (zipCode !== undefined && zipCode !== existingProfile.zipCode) ||
        (city !== undefined && city !== existingProfile.city) ||
        (state !== undefined && state !== existingProfile.state);

      if (locationFieldsChanged && (zipCode || (city && state))) {
        const approx = geocodeApprox({ zipCode, city, state });
        if (approx) {
          location = { type: 'Point', coordinates: [approx.longitude, approx.latitude] };
        }
      }
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

    let profile = existingProfile;

    let isNewlyCompleted = false;

    if (profile) {
      if (!profile.profileComplete && profileFields.profileComplete) {
        isNewlyCompleted = true;
      }
      // Update existing
      profile = await Profile.findOneAndUpdate({ user: req.user._id }, { $set: profileFields }, { new: true }).populate(
        'user',
        'name email'
      );
    } else {
      // Create new
      profile = await Profile.create(profileFields);
      profile = await Profile.findById(profile._id).populate('user', 'name email emailVerified');
      isNewlyCompleted = true;
    }

    // Notification Logic for New User Nearby
    try {
      if (isNewlyCompleted && profile.state) {
        const nearbyProfiles = await Profile.find({
          state: profile.state,
          user: { $ne: req.user._id }
        });
        
        const notificationsToInsert = nearbyProfiles
          .filter(p => p.notificationSettings?.nearbyUsers !== false)
          .map(p => ({
            recipient: p.user,
            type: 'new_user_nearby',
            title: 'New Player Nearby',
            body: `${profile.user.name} just joined Pickleball Finder in your area.`,
            referenceId: profile.user._id,
          }));

        if (notificationsToInsert.length > 0) {
          await Notification.insertMany(notificationsToInsert);
        }
      }
    } catch (notifErr) {
      console.error('Failed to send new user notifications', notifErr);
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
    const profile = await Profile.findOne({ user: req.params.userId }).populate('user', 'name email emailVerified');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    let connectionStatus = 'none';
    let conversationId = null;
    let matchScore = null;

    if (req.user && req.user._id) {
      const conv = await Conversation.findOne({
        participants: { $all: [req.user._id, req.params.userId] },
      });

      if (conv) {
        conversationId = conv._id;
        if (conv.status === 'accepted') {
          connectionStatus = 'accepted';
        } else if (conv.status === 'pending') {
          connectionStatus = (conv.initiator && conv.initiator.toString() === req.user._id.toString())
            ? 'pending_sent'
            : 'pending_received';
        }
      }

      const myProfile = await Profile.findOne({ user: req.user._id }, 'skillLevel playStyle location');
      const distanceKm = Math.round(
        (haversineKm(myProfile?.location?.coordinates, profile.location?.coordinates) ?? NaN) * 10
      ) / 10;
      matchScore = computeMatchScore(myProfile, profile, Number.isNaN(distanceKm) ? null : distanceKm);
    }

    res.status(200).json({ success: true, data: { ...profile.toObject(), connectionStatus, conversationId, matchScore } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// zipcodes.lookupByCoords always returns the *nearest* entry in its offline
// US dataset, with no distance cutoff — for a coordinate outside the US
// (or in the ocean) it will still confidently return some far-away US zip.
// Reject matches further than this from the query point so non-US/no-fix
// coordinates come back as `data: null` instead of a bogus suggestion.
const REVERSE_GEOCODE_MAX_KM = 100;

// Military/diplomatic mail "states" (Armed Forces Europe/Americas/Pacific)
// carry real-world coordinates near embassies/bases abroad, which can be
// deceptively close to a real foreign city (e.g. an AE zip sitting right at
// the US Embassy in London). They aren't options in the app's state
// dropdown, so never suggest them.
const NON_STATE_CODES = new Set(['AA', 'AE', 'AP']);

// @desc    Resolve device coordinates to a city/state/zip suggestion
// @route   GET /api/profile/reverse-geocode?lat=&lng=
// @access  Private
// Read-only — never touches the DB, so it's safe to call mid-onboarding
// without prematurely marking the profile complete (see updateMyProfile).
const reverseGeocode = async (req, res) => {
  try {
    const latNum = Number(req.query.lat);
    const lngNum = Number(req.query.lng);

    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      return res.status(400).json({ success: false, message: 'lat and lng must be numbers' });
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ success: false, message: 'lat/lng are out of range' });
    }

    const match = zipcodes.lookupByCoords(latNum, lngNum);
    const distanceKm = match
      ? haversineKm([lngNum, latNum], [match.longitude, match.latitude])
      : null;

    if (
      !match ||
      distanceKm == null ||
      distanceKm > REVERSE_GEOCODE_MAX_KM ||
      NON_STATE_CODES.has(match.state)
    ) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({
      success: true,
      data: { city: match.city, state: match.state, zipCode: match.zip },
    });
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

module.exports = { getMyProfile, updateMyProfile, getProfileByUserId, deleteMyProfile, uploadAvatar, reverseGeocode };
