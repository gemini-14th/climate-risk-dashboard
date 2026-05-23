// TODO: Phase 2 — Implement proper rate limiting with express-rate-limit
const rateLimiter = (req, res, next) => {
  // Stub: no rate limiting applied in Phase 1
  next();
};

module.exports = rateLimiter;
