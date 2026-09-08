/**
 * Punkt wejścia serwera PrivateCloud — Fazy 1–6.
 * Lokalnie: npm run dev | Docker: docker compose up --build
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initDb, seedUsers, seedDisks, seedSyncJobs } = require('./db');
const filesRouter = require('./routes/files');
const { verifyToken, requireAdmin } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const disksRouter = require('./routes/disks');
const { router: metricsRouter, trackConnection } = require('./routes/metrics');
const sharesRouter = require('./routes/shares');
const publicSharesRouter = require('./routes/publicShares');
const mediaRouter = require('./routes/media');
const { router: syncRouter, startSyncWorker } = require('./routes/sync');

const PORT = process.env.PORT || 3000;

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost',
];

const CORS_ORIGINS = (process.env.CORS_ORIGINS || DEFAULT_CORS_ORIGINS.join(','))
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

initDb();
seedUsers();
seedDisks();
seedSyncJobs();

const app = express();

app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Share-Password'],
}));
app.use(express.json());
app.use(trackConnection);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/files', verifyToken, filesRouter);
app.use('/api/shares', verifyToken, sharesRouter);
app.use('/api/sync', verifyToken, syncRouter);
app.use('/api/admin/disks', verifyToken, requireAdmin, disksRouter);
app.use('/api/admin/metrics', verifyToken, requireAdmin, metricsRouter);

// Media: lista wymaga JWT; stream może użyć ?access_token= (tag <video>)
app.use('/api/media', (req, res, next) => {
  if (req.method === 'GET' && /\/[^/]+\/stream\/?$/.test(req.path)) {
    return next();
  }
  return verifyToken(req, res, next);
}, mediaRouter);

// Publiczne linki — bez JWT (curl + frontend przez /api/s)
app.use('/s', publicSharesRouter);
app.use('/api/s', publicSharesRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Nie znaleziono endpointu' });
});

app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Wewnętrzny błąd serwera',
  });
});

app.listen(PORT, () => {
  console.log(`[server] PrivateCloud API działa na http://localhost:${PORT}`);
  console.log(`[server] Health: http://localhost:${PORT}/health`);
  startSyncWorker();
});
