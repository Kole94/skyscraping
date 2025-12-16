const { listAllWords, addWord, getUserById, listArticleContents, deleteWordById } = require('../db');
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

  app.delete('/api/words/:id', requireAuth, async (req, res) => {
    try {
      const idNum = Number(req.params.id);
      if (!Number.isFinite(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const ok = await deleteWordById(idNum, req.user.userId);
      if (!ok) return res.status(404).json({ error: 'Not found' });
      return res.status(204).send();
    } catch (err) {
      console.error('Failed to delete word:', err?.message || err);
      res.status(500).json({ error: 'Failed to delete word' });
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

  app.get('/api/words/stats', async (req, res) => {
    try {
      const limitParam = parseInt(req.query.limit, 10);
      const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;

      const wordsRows = await listAllWords(1000);
      const words = wordsRows.map((w) => String(w.word || '').trim()).filter(Boolean);
      if (!words.length) {
        return res.json({ totalArticles: 0, stats: [] });
      }

      // Use stored articles from DB for consistent results
      const contents = (await listArticleContents(limit)).map((c) => String(c || ''));

      const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Unicode-aware word boundary using lookarounds and \p{L}\p{N}
      const makeRegex = (w) => new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegExp(w)}(?![\\p{L}\\p{N}_])`, 'giu');
      const countMatches = (text, re) => {
        const m = text.match(re);
        return m ? m.length : 0;
      };

      const stats = words.map((w) => {
        const re = makeRegex(w);
        let total = 0;
        for (const content of contents) {
          total += countMatches(content, re);
        }
        return { word: w, count: total };
      });

      res.json({ totalArticles: contents.length, stats });
    } catch (err) {
      console.error('Failed to compute word stats:', err?.message || err);
      res.status(500).json({ error: 'Failed to compute word stats' });
    }
  });
}

module.exports = { registerWordsRoutes };


