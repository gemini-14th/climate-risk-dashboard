const express = require('express');
const cors = require('cors');
require('dotenv').config();

const forecastRoutes = require('./routes/forecast.routes');
const riskRoutes     = require('./routes/risk.routes');
const alertsRoutes   = require('./routes/alerts.routes');
const countyRoutes   = require('./routes/county.routes');
const errorHandler   = require('./middleware/errorHandler');
const { startDataFetcherJob } = require('./jobs/dataFetcher.job');

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────────
// In production, only allow requests from the deployed frontend URL.
// In development, allow localhost on any port.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,           // e.g. https://your-app.vercel.app
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Render health checks, curl, UptimeRobot)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
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
app.listen(PORT, () => {
  console.log(`🌍 Climate Risk Dashboard API running on port ${PORT}`);
  startDataFetcherJob();
});
