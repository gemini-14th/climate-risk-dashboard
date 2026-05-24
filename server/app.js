const express = require('express');
const cors = require('cors');
require('dotenv').config();

const forecastRoutes = require('./routes/forecast.routes');
const riskRoutes     = require('./routes/risk.routes');
const alertsRoutes   = require('./routes/alerts.routes');
const countyRoutes   = require('./routes/county.routes');
const errorHandler   = require('./middleware/errorHandler');
const { startDataFetcherJob } = require('./jobs/dataFetcher.job');
const { runMigrations }       = require('./db/migrate');

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://climate-risk-dashboard-eta.vercel.app'
  ],
  credentials: true
}));

// ── Middleware ──
app.use(express.json());

// ── Routes ──
app.use('/api/forecast', forecastRoutes);
app.use('/api/risk',     riskRoutes);
app.use('/api/alerts',   alertsRoutes);
app.use('/api/county',   countyRoutes);

// ── Health Check (used by UptimeRobot to keep Render awake) ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV || 'development' });
});

// ── Global Error Handler ──
app.use(errorHandler);

// ── Start Server ──
// 1. Auto-create database tables (safe to re-run — uses IF NOT EXISTS)
// 2. Then start the data pipeline
app.listen(PORT, async () => {
  console.log(`🌍 Climate Risk Dashboard API running on port ${PORT}`);

  try {
    await runMigrations();
    console.log('✅ Database tables ready.');
    startDataFetcherJob();
  } catch (err) {
    console.error('❌ Migration failed — data pipeline NOT started:', err.message);
    console.error('Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT in your environment variables.');
  }
});
