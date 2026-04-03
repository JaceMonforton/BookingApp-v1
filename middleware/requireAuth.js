const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization;
    const raw = h?.startsWith('Bearer ') ? h.slice(7) : null;
    if (!raw) return sendError(res, 'Unauthorized', 401);
    const decoded = jwt.verify(raw, process.env.JWT_SECRET);
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    return sendError(res, 'Unauthorized', 401);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 'Unauthorized', 401);
    if (!roles.includes(req.user.role)) return sendError(res, 'Forbidden', 403);
    next();
  };
}

module.exports = { requireAuth, requireRole };
