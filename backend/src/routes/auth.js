const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById, userToPublic } = require('../db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

// POST /api/auth/login — PUBLICZNY (bez verifyToken)
router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Wymagane pola: email, password' });
    }

    const row = findUserByEmail(String(email).trim().toLowerCase());
    if (!row || !bcrypt.compareSync(String(password), row.password_hash)) {
      return res.status(401).json({ error: 'Nieprawidłowy e-mail lub hasło' });
    }

    const user = userToPublic(row);
    res.json({ accessToken: signAccessToken(user), user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — CHRONIONY (verifyToken przed handlerem)
router.get('/me', verifyToken, (req, res, next) => {
  try {
    const row = findUserById(req.user.id);
    if (!row) {
      return res.status(401).json({ error: 'Użytkownik nie istnieje' });
    }
    res.json({ user: userToPublic(row) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;