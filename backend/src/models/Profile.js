const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String, // URL
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'lowIntermediate', 'highIntermediate', 'advanced', 'professional'],
    },
    ageRange: {
      type: String, // e.g. "60-65"
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    availability: {
      type: mongoose.Schema.Types.Mixed, // e.g. { Mon: { start: '9:00 AM', end: '5:00 PM' } }
    },
    playStyle: {
      type: String,
      enum: ['singles', 'doubles', 'mixed', 'any'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      // GeoJSON coordinates are [longitude, latitude]
      coordinates: {
        type: [Number],
      },
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    notificationSettings: {
      requests: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      replies: { type: Boolean, default: true },
      nearbyUsers: { type: Boolean, default: true },
      nearbyPosts: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups by state + skill level (for matchmaking)
profileSchema.index({ state: 1, skillLevel: 1 });
profileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Profile', profileSchema);
