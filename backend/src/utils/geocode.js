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

/**
 * Validates a { latitude, longitude } pair and returns a GeoJSON Point, or
 * throws if either is missing/invalid. Shared by any controller that lets
 * a client submit a precise device location instead of an approximate one.
 */
function pointFromCoords({ latitude, longitude }) {
  const latNum = Number(latitude);
  const lngNum = Number(longitude);

  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    throw new Error('latitude and longitude must be numbers');
  }
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    throw new Error('latitude/longitude are out of range');
  }

  return { type: 'Point', coordinates: [lngNum, latNum] };
}

module.exports = { geocodeApprox, pointFromCoords };
