const { fetchN1NewsList, fetchN1NewsWithContent } = require('../scraper');
const { upsertArticles } = require('../db');

function registerNewsRoutes(app) {
  app.get('/api/news', async (req, res) => {
    try {
      const list = await fetchN1NewsList();
      const limitParam = parseInt(req.query.limit, 10);
      const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;
      const sliced = list.slice(0, limit);
      const items = await fetchN1NewsWithContent(sliced, { concurrency: 5 });
      res.json({ count: items.length, items });
    } catch (err) {
      console.error('Failed to fetch news:', err?.message || err);
      res.status(502).json({ error: 'Failed to fetch news from source' });
    }
  });

  app.get('/api/news/ingest', async (req, res) => {
    try {
      const list = await fetchN1NewsList();
      const limitParam = parseInt(req.query.limit, 10);
      const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;
      const sliced = list.slice(0, limit);
      const items = await fetchN1NewsWithContent(sliced, { concurrency: 5 });
      const minimal = items
        .map((i) => ({
          title: i.title,
          url: i.url,
          content: i.content || '',
        }))
        .filter((i) => i.title && i.url && i.content);
      const result = await upsertArticles(minimal);
      res.json({ requested: sliced.length, scraped: items.length, saved: result.upserted });
    } catch (err) {
      console.error('Failed to ingest news:', err?.message || err);
      res.status(500).json({ error: 'Failed to ingest news' });
    }
  });
}

module.exports = { registerNewsRoutes };


