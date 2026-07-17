const { getMessaging } = require('firebase-admin/messaging');
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
  console.log(`[push] sendPushNotification called for recipient ${recipientId}: "${title}"`);

  const app = getFirebaseApp();
  if (!app) {
    console.warn('[push] Firebase app not configured — skipping send.');
    return;
  }

  const user = await User.findById(recipientId).select('pushTokens');
  if (!user || !user.pushTokens?.length) {
    console.log(`[push] No push tokens registered for user ${recipientId} — skipping send.`);
    return;
  }

  const tokens = user.pushTokens.map((t) => t.token);
  console.log(`[push] Sending to ${tokens.length} token(s) for user ${recipientId}:`, user.pushTokens.map((t) => `${t.platform}:${t.token.slice(0, 12)}...`));

  // FCM requires all `data` values to be strings
  const stringData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value)])
  );

  const response = await getMessaging(app).sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: stringData,
  });

  console.log(`[push] FCM response: ${response.successCount} succeeded, ${response.failureCount} failed`);

  const invalidTokens = [];
  response.responses.forEach((r, i) => {
    if (!r.success) {
      console.error(`[push] Token ${tokens[i].slice(0, 12)}... failed:`, r.error?.code, r.error?.message);
      if (INVALID_TOKEN_ERROR_CODES.includes(r.error?.code)) {
        invalidTokens.push(tokens[i]);
      }
    }
  });

  if (invalidTokens.length) {
    console.log(`[push] Removing ${invalidTokens.length} invalid token(s) for user ${recipientId}`);
    await User.updateOne(
      { _id: recipientId },
      { $pull: { pushTokens: { token: { $in: invalidTokens } } } }
    );
  }
};

module.exports = { sendPushNotification };
