const express = require('express');
const { initDb, pool } = require('./db');
const cors = require('cors');
const { registerNewsRoutes } = require('./routes/news');
const { registerArticlesRoutes } = require('./routes/articles');
const { registerWordsRoutes } = require('./routes/words');
const { startIngestScheduler } = require('./jobs/ingestJob');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:3000',
        'http://159.89.30.87:3001',
        process.env.FRONTEND_ORIGIN
      ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow all localhost origins
      if (process.env.NODE_ENV !== 'production' && origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: false,
  })
);
app.get('/', (req, res) => {
  res.send('Server is up');
});

const { registerAuthRoutes } = require('./routes/auth');
registerNewsRoutes(app);
registerArticlesRoutes(app);
registerWordsRoutes(app);
registerAuthRoutes(app);

async function start() {
  try {
    async function waitForDb(maxAttempts = 30, delayMs = 1000) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await pool.query('SELECT 1');
          return;
        } catch (e) {
          if (attempt === maxAttempts) throw e;
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }
    await waitForDb();
    await initDb();
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });

    startIngestScheduler({
      intervalMs: process.env.INGEST_INTERVAL_MS,
      limit: process.env.INGEST_LIMIT,
      concurrency: process.env.INGEST_CONCURRENCY,
    });
  } catch (err) {
    console.error('Server failed to start:', err?.message || err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };

