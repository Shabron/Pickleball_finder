const SKILL_ORDER = { beginner: 0, lowIntermediate: 1, highIntermediate: 2, advanced: 3, professional: 4 };

/**
 * Great-circle distance in km between two GeoJSON [longitude, latitude] pairs.
 */
function haversineKm(coordsA, coordsB) {
  if (!Array.isArray(coordsA) || !Array.isArray(coordsB)) return null;
  const [lng1, lat1] = coordsA;
  const [lng2, lat2] = coordsB;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Deterministic 0-100 compatibility score from real, stable profile data:
 * skill level closeness (50pts), play style overlap (25pts), distance
 * (25pts). Only changes when a profile or location actually changes —
 * replaces the old client-side Math.random() score that re-rolled on
 * every screen visit.
 */
function computeMatchScore(myProfile, otherProfile, distanceKm) {
  let skillPts = 25; // neutral default when either skill level is unset
  const a = SKILL_ORDER[myProfile?.skillLevel];
  const b = SKILL_ORDER[otherProfile?.skillLevel];
  if (a != null && b != null) {
    const diff = Math.abs(a - b);
    skillPts = diff === 0 ? 50 : diff === 1 ? 35 : diff === 2 ? 20 : 10;
  }

  let stylePts = 15; // neutral default when either play style is unset
  if (myProfile?.playStyle && otherProfile?.playStyle) {
    const same = myProfile.playStyle === otherProfile.playStyle;
    const eitherAny = myProfile.playStyle === 'any' || otherProfile.playStyle === 'any';
    stylePts = same || eitherAny ? 25 : 10;
  }

  let distPts = 10; // neutral default when distance is unknown
  if (typeof distanceKm === 'number') {
    distPts = distanceKm <= 2 ? 25 : distanceKm <= 5 ? 20 : distanceKm <= 10 ? 15 : distanceKm <= 20 ? 10 : 5;
  }

  return Math.round(skillPts + stylePts + distPts);
}

module.exports = { computeMatchScore, haversineKm };
