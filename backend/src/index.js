/**
 * Punkt wejścia serwera PrivateCloud — Fazy 1–4 (auth, pliki, Docker).
 * Lokalnie: npm run dev | Docker: docker compose up --build
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initDb, seedUsers } = require('./db');
const filesRouter = require('./routes/files');
const { verifyToken } = require('./middleware/auth');
const authRouter = require('./routes/auth');

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

const app = express();

// CORS — przed innym middleware, żeby preflight OPTIONS dostał nagłówki.
// W Dockerze (nginx same-origin) przeglądarka zwykle nie potrzebuje CORS;
// lista nadal przydatna przy bezpośrednim dostępie do API / dev.
app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Middleware — parsowanie JSON (przyda się w kolejnych fazach)
app.use(express.json());

// Health check — monitoring i szybki test
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Trasy plików pod /api/files
app.use('/api/auth', authRouter);
app.use('/api/files', verifyToken, filesRouter);

// 404 — nieznana trasa
app.use((req, res) => {
  res.status(404).json({ error: 'Nie znaleziono endpointu' });
});

// Globalny handler błędów
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Wewnętrzny błąd serwera',
  });
});

app.listen(PORT, () => {
  console.log(`[server] PrivateCloud API działa na http://localhost:${PORT}`);
  console.log(`[server] Health: http://localhost:${PORT}/health`);
});
