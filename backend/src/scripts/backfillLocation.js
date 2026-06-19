/**
 * One-off backfill: for existing profiles that already have a zip/city/state
 * but no `location` yet (created before geocoding was wired up), derive an
 * approximate point so they show up on the map / in nearby-player search.
 *
 * Usage:  node src/scripts/backfillLocation.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const { geocodeApprox } = require('../utils/geocode');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Scanning profiles missing location...');

  const profiles = await Profile.find({
    'location.coordinates': { $exists: false },
    $or: [{ zipCode: { $exists: true, $ne: null } }, { city: { $exists: true, $ne: null } }],
  });

  let updated = 0;
  for (const profile of profiles) {
    const approx = geocodeApprox({ zipCode: profile.zipCode, city: profile.city, state: profile.state });
    if (approx) {
      profile.location = { type: 'Point', coordinates: [approx.longitude, approx.latitude] };
      await profile.save();
      updated += 1;
    }
  }

  console.log(`Backfilled ${updated} of ${profiles.length} candidate profiles.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
