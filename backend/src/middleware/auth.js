const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function verifyToken(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Brak tokena autoryzacji' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token wygasł' : 'Nieprawidłowy token';
    return res.status(401).json({ error: message });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Wymagane uprawnienia administratora' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin, JWT_SECRET };