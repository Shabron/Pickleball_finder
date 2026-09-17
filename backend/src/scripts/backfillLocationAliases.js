/**
 * Location backfill (v2): finds every profile missing `location` and tries
 * to resolve one, including a small alias table for common city
 * abbreviations the offline `zipcodes` dataset doesn't recognize by exact
 * name (e.g. "SF" / "la"). Safe by default — prints a report and writes
 * nothing unless you pass --apply.
 *
 * Usage:
 *   node src/scripts/backfillLocationAliases.js            # dry run, no writes
 *   node src/scripts/backfillLocationAliases.js --apply    # actually saves
 *
 * Run this from a machine whose IP is allowed through the Atlas cluster's
 * network access list (this repo's sandboxed dev environment is not).
 */
require('dotenv').config();
const mongoose = require('mongoose');
require('../models/User');
const Profile = require('../models/Profile');
const { geocodeApprox } = require('../utils/geocode');

// Keyed by lowercased "state:city" so "la" only expands to Los Angeles
// within CA, not any other state. Add more here as you find them.
const CITY_ALIASES = {
  'ca:la': 'Los Angeles',
  'ca:sf': 'San Francisco',
  'ny:nyc': 'New York',
  'dc:dc': 'Washington',
};

function resolveApprox(profile) {
  let approx = geocodeApprox({ zipCode: profile.zipCode, city: profile.city, state: profile.state });
  let usedAlias = null;
  if (!approx && profile.city && profile.state) {
    const alias = CITY_ALIASES[`${profile.state.toLowerCase()}:${profile.city.toLowerCase()}`];
    if (alias) {
      approx = geocodeApprox({ zipCode: profile.zipCode, city: alias, state: profile.state });
      usedAlias = alias;
    }
  }
  return { approx, usedAlias };
}

async function run() {
  const apply = process.argv.includes('--apply');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected. Scanning profiles missing location (${apply ? 'APPLYING WRITES' : 'dry run, no writes'})...\n`);

  const profiles = await Profile.find({ 'location.coordinates': { $exists: false } }).populate('user', 'name');

  const resolvable = [];
  const unresolvable = [];

  for (const profile of profiles) {
    const { approx, usedAlias } = resolveApprox(profile);
    if (approx) resolvable.push({ profile, approx, usedAlias });
    else unresolvable.push(profile);
  }

  console.log(`Total profiles missing location: ${profiles.length}\n`);

  console.log(`── ${apply ? 'Resolving' : 'Would resolve'} (${resolvable.length}) ──`);
  for (const { profile, approx, usedAlias } of resolvable) {
    console.log(
      `  ${profile.user?.name || profile.user} | city="${profile.city}" state="${profile.state}" zip="${profile.zipCode}"` +
        (usedAlias ? ` (via alias "${profile.city}"->"${usedAlias}")` : '') +
        ` -> [${approx.latitude}, ${approx.longitude}]`
    );
    if (apply) {
      profile.location = { type: 'Point', coordinates: [approx.longitude, approx.latitude] };
      await profile.save();
    }
  }

  console.log(`\n── Still unresolvable (${unresolvable.length}) — need a real city name or zip from the user ──`);
  unresolvable.forEach((profile) => {
    console.log(`  ${profile.user?.name || profile.user} | city="${profile.city}" state="${profile.state}" zip="${profile.zipCode}"`);
  });

  if (!apply && resolvable.length > 0) {
    console.log('\nThis was a dry run — nothing was written. Re-run with --apply to save these.');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
