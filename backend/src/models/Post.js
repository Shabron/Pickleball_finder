const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 1000,
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'lowIntermediate', 'highIntermediate', 'advanced', 'professional'],
    },
    playStyle: {
      type: String,
      enum: ['singles', 'doubles', 'mixed', 'any'],
    },
    preferredTime: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open',
    },
  },
  {
    timestamps: true,
  }
);

// Helpful queries for discovery
postSchema.index({ state: 1, status: 1 });
postSchema.index({ author: 1 });

module.exports = mongoose.model('Post', postSchema);

