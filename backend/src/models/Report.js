const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: ['harassment', 'inappropriate_behavior', 'fake_profile', 'no_show', 'safety_concern', 'other'],
      required: true,
    },
    details: {
      type: String,
      maxlength: 1000,
    },
    context: {
      type: String,
      enum: ['profile', 'chat'],
    },
    status: {
      type: String,
      enum: ['open', 'reviewed'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ reportedUser: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);
