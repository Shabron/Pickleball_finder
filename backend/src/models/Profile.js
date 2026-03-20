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
      enum: ['Beginner', 'Intermediate', 'Advanced'],
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
      type: [String], // e.g. ["Mon AM", "Wed PM"]
    },
    playStyle: {
      type: String,
      enum: ['Singles', 'Doubles', 'Both'],
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups by state + skill level (for matchmaking)
profileSchema.index({ state: 1, skillLevel: 1 });

module.exports = mongoose.model('Profile', profileSchema);
