const { getFirebaseApp } = require('../config/firebaseAdmin');
const User = require('../models/User');

const INVALID_TOKEN_ERROR_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
];

/**
 * Sends a push notification to every device registered for a user.
 * No-ops silently if Firebase isn't configured or the user has no
 * registered devices — this must never throw into the caller's request flow.
 */
const sendPushNotification = async (recipientId, { title, body, data = {} }) => {
  const app = getFirebaseApp();
  if (!app) return;

  const user = await User.findById(recipientId).select('pushTokens');
  if (!user || !user.pushTokens?.length) return;

  const tokens = user.pushTokens.map((t) => t.token);

  // FCM requires all `data` values to be strings
  const stringData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value)])
  );

  const response = await app.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: stringData,
  });

  const invalidTokens = [];
  response.responses.forEach((r, i) => {
    if (!r.success && INVALID_TOKEN_ERROR_CODES.includes(r.error?.code)) {
      invalidTokens.push(tokens[i]);
    }
  });

  if (invalidTokens.length) {
    await User.updateOne(
      { _id: recipientId },
      { $pull: { pushTokens: { token: { $in: invalidTokens } } } }
    );
  }
};

module.exports = { sendPushNotification };
