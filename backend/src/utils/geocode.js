const zipcodes = require('zipcodes');

/**
 * Resolve an approximate { latitude, longitude } for a US profile from its
 * zip code (preferred) or city/state, using the offline `zipcodes` dataset.
 * No external API calls, no API key, no cost — good enough for "players
 * near you" radius search, not for turn-by-turn precision.
 *
 * Returns null if nothing usable was found.
 */
function geocodeApprox({ zipCode, city, state }) {
  if (zipCode) {
    const byZip = zipcodes.lookup(String(zipCode).trim());
    if (byZip) {
      return { latitude: byZip.latitude, longitude: byZip.longitude };
    }
  }

  if (city && state) {
    const matches = zipcodes.lookupByName(city, state) || [];
    if (matches.length > 0) {
      return { latitude: matches[0].latitude, longitude: matches[0].longitude };
    }
  }

  return null;
}

module.exports = { geocodeApprox };
