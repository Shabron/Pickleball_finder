const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    tags: [
      {
        type: String,
        enum: ['Great partner', 'Reliable', 'Skilled', 'Good communicator', 'No-show', 'Poor communication'],
      },
    ],
    comment: {
      type: String,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

// One rating per (rater, ratedUser) pair — rate again to update it.
ratingSchema.index({ rater: 1, ratedUser: 1 }, { unique: true });
ratingSchema.index({ ratedUser: 1 });

module.exports = mongoose.model('Rating', ratingSchema);
