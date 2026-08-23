/**
 * One-off backfill: for existing posts that already have a city/state but no
 * `location` yet (created before geocoding was wired up), derive an
 * approximate point so they sort correctly in the nearest-first feed.
 *
 * Usage:  node src/scripts/backfillPostLocation.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const { geocodeApprox } = require('../utils/geocode');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Scanning posts missing location...');

  const posts = await Post.find({
    'location.coordinates': { $exists: false },
    state: { $exists: true, $ne: null },
  });

  let updated = 0;
  for (const post of posts) {
    const approx = geocodeApprox({ city: post.city, state: post.state });
    if (approx) {
      post.location = { type: 'Point', coordinates: [approx.longitude, approx.latitude] };
      await post.save();
      updated += 1;
    }
  }

  console.log(`Backfilled ${updated} of ${posts.length} candidate posts.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
