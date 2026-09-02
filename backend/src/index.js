/**
 * Punkt wejścia serwera PrivateCloud — Faza 3 (auth + chronione pliki).
 * Uruchom: npm run dev
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initDb, seedUsers } = require('./db');
const filesRouter = require('./routes/files');
const { verifyToken } = require('./middleware/auth');
const authRouter = require('./routes/auth');

const PORT = process.env.PORT || 3000;

initDb();
seedUsers();

const app = express();

// CORS — przed innym middleware, żeby preflight OPTIONS dostał nagłówki
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
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
