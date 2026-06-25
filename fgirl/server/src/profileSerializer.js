import db from './db.js';

const ratingStmt = db.prepare(
  'SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS avg FROM reviews WHERE profile_id = ?'
);

// Convert a raw profile row into an API-friendly object (JSON fields parsed,
// booleans coerced, rating aggregates attached).
export function serializeProfile(row) {
  if (!row) return null;
  const rating = ratingStmt.get(row.id);
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    city: row.city,
    age: row.age,
    gender: row.gender,
    headline: row.headline,
    bio: row.bio,
    hourlyRate: row.hourly_rate,
    currency: row.currency,
    services: safeJson(row.services),
    languages: safeJson(row.languages),
    photoUrl: row.photo_url,
    available: !!row.available,
    verified: !!row.verified,
    createdAt: row.created_at,
    rating: Number(rating.avg.toFixed(2)),
    reviewCount: rating.count,
  };
}

function safeJson(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
