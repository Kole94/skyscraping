const { listAllWords, addWord, getUserById } = require('../db');
const { requireAuth } = require('./auth');

function registerWordsRoutes(app) {
  app.get('/api/words', async (req, res) => {
    try {
      const limitParam = parseInt(req.query.limit, 10);
      const limit = Number.isFinite(limitParam) ? limitParam : 200;
      const rows = await listAllWords(limit);
      res.json({ count: rows.length, items: rows });
    } catch (err) {
      console.error('Failed to list words:', err?.message || err);
      res.status(500).json({ error: 'Failed to list words' });
    }
  });

  app.post('/api/words', requireAuth, async (req, res) => {
    try {
      const { word } = req.body || {};
      if (!word || typeof word !== 'string' || !word.trim()) {
        return res.status(400).json({ error: 'word is required' });
      }
      // Ensure user still exists (e.g., after DB reset)
      const user = await getUserById(req.user.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found. Please login again.' });
      }
      const created = await addWord(req.user.userId, word.trim());
      return res.status(201).json({ item: created });
    } catch (err) {
      console.error('Failed to add word:', err?.message || err);
      // Return a more helpful message in development
      const isProd = process.env.NODE_ENV === 'production';
      res.status(500).json({ error: isProd ? 'Failed to add word' : `Failed to add word: ${err?.message || err}` });
    }
  });
}

module.exports = { registerWordsRoutes };


