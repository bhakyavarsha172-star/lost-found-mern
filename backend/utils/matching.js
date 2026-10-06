// Very small "smart matching" heuristic: given one item (lost or found),
// score every item of the opposite type on category, location word overlap,
// title/description word overlap, and how close the dates are.
// This is intentionally simple (no ML) but gives useful ranked suggestions.

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function overlapScore(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let common = 0;
  setA.forEach(w => { if (setB.has(w)) common++; });
  return common / Math.max(setA.size, setB.size); // 0..1
}

function dateProximityScore(dateA, dateB, windowDays = 14) {
  const diffDays = Math.abs(new Date(dateA) - new Date(dateB)) / (1000 * 60 * 60 * 24);
  if (diffDays > windowDays) return 0;
  return 1 - diffDays / windowDays; // closer dates score higher
}

function scoreMatch(target, candidate) {
  const categoryScore = target.category === candidate.category ? 1 : 0;
  const locationScore = overlapScore(target.location, candidate.location);
  const textScore = overlapScore(
    `${target.title} ${target.description}`,
    `${candidate.title} ${candidate.description}`
  );
  const dateScore = dateProximityScore(target.date, candidate.date);

  // Weighted combination — category and location matter most for a real-world match
  const total = categoryScore * 0.4 + locationScore * 0.3 + dateScore * 0.2 + textScore * 0.1;
  return Math.round(total * 100); // percentage
}

function findMatches(target, candidates, minScore = 25, limit = 10) {
  return candidates
    .map(c => ({ item: c, score: scoreMatch(target, c) }))
    .filter(m => m.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = { findMatches, scoreMatch };
