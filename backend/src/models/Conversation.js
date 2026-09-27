const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    declinedAt: {
      type: Date,
    },
    // Initiator removed a request that was silently declined. Kept (not
    // deleted) so the 30-day cool-down still applies.
    initiatorHidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
