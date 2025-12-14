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
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3001',
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

