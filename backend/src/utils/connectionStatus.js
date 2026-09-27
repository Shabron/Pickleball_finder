/**
 * How a conversation looks from one user's point of view.
 *
 * Declines are "soft": the person who sent the request is never told. For
 * REQUEST_COOLDOWN_DAYS the request keeps looking like it is still waiting,
 * then it quietly disappears and they may ask again.
 */
const REQUEST_COOLDOWN_DAYS = 30;
const COOLDOWN_MS = REQUEST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

const idStr = (v) => (v && v._id ? v._id.toString() : v ? v.toString() : '');

function isInCooldown(conv) {
  if (conv.status !== 'rejected') return false;
  const at = conv.declinedAt || conv.updatedAt;
  return !!at && Date.now() - new Date(at).getTime() < COOLDOWN_MS;
}

/** @returns {'accepted'|'pending_sent'|'pending_received'|'none'} */
function viewStatus(conv, userId) {
  if (!conv) return 'none';
  const iStarted = idStr(conv.initiator) === idStr(userId);
  if (conv.status === 'accepted') return 'accepted';
  if (conv.status === 'pending') return iStarted ? 'pending_sent' : 'pending_received';
  if (conv.status === 'rejected' && iStarted && isInCooldown(conv) && !conv.initiatorHidden) return 'pending_sent';
  return 'none';
}

module.exports = { REQUEST_COOLDOWN_DAYS, isInCooldown, viewStatus };
