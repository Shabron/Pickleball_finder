const Profile = require('../models/Profile');

/**
 * Mutates each user-shaped object in `users` (each needs at least `_id`) to
 * add `.avatar`, sourced from Profile — avatar lives there, never on User,
 * so populate('...', '... avatar') is always a silent no-op.
 *
 * Objects must be plain (.lean()/.toObject()'d), not hydrated Mongoose
 * documents — assigning an extra field onto a populated Mongoose
 * sub-document gets silently stripped by its own schema on serialization.
 */
async function attachAvatarsToUsers(users) {
  const list = users.filter(Boolean);
  const ids = [...new Set(list.map((u) => u._id?.toString()).filter(Boolean))];
  if (ids.length === 0) return users;

  const profiles = await Profile.find({ user: { $in: ids } }, 'user avatar').lean();
  const avatarByUser = new Map(profiles.map((p) => [p.user.toString(), p.avatar]));

  list.forEach((u) => {
    u.avatar = avatarByUser.get(u._id.toString()) || undefined;
  });

  return users;
}

/** Convenience wrapper for the common case: docs[i][field] holds one populated user (e.g. post.author). */
async function attachAuthorAvatars(docs, field = 'author') {
  const list = Array.isArray(docs) ? docs : [docs];
  await attachAvatarsToUsers(list.map((d) => d?.[field]));
  return docs;
}

module.exports = { attachAuthorAvatars, attachAvatarsToUsers };
