const { listArticles } = require('../db');

function registerArticlesRoutes(app) {
  app.get('/api/articles', async (req, res) => {
    try {
      const limitParam = parseInt(req.query.limit, 10);
      const limit = Number.isFinite(limitParam) ? limitParam : 20;
      const rows = await listArticles(limit);
      res.json({ count: rows.length, items: rows });
    } catch (err) {
      console.error('Failed to list articles:', err?.message || err);
      res.status(500).json({ error: 'Failed to list articles' });
    }
  });
}

module.exports = { registerArticlesRoutes };


