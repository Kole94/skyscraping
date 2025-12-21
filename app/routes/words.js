const { listAllWords, addWord, getUserById, listArticleContents, deleteWordById, getWordById, listArticles } = require('../db');
const { getAllWordForms, createDeclensionRegex } = require('../serbian-utils');
const { requireAuth } = require('./auth');

function registerWordsRoutes(app) {
  console.log('Registering words routes...');
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
      const { word, useDeclensions = false, declensionPatterns = [], stemmingEnabled = true } = req.body || {};
      if (!word || typeof word !== 'string' || !word.trim()) {
        return res.status(400).json({ error: 'word is required' });
      }

      // Validate declension patterns if provided
      if (useDeclensions && (!Array.isArray(declensionPatterns) || declensionPatterns.some(p => typeof p !== 'string'))) {
        return res.status(400).json({ error: 'declensionPatterns must be an array of strings' });
      }

      // Ensure user still exists (e.g., after DB reset)
      const user = await getUserById(req.user.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found. Please login again.' });
      }

      const created = await addWord(req.user.userId, word.trim(), {
        useDeclensions,
        declensionPatterns,
        stemmingEnabled
      });
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
      if (!wordsRows.length) {
        return res.json({ totalArticles: 0, stats: [] });
      }

      // Use stored articles from DB for consistent results
      // For stats, check more articles to get comprehensive results
      const statsLimit = Math.min(Math.max(limitParam, 1), 100); // Allow up to 100 articles for stats
      const contents = (await listArticleContents(statsLimit)).map((c) => String(c || ''));

      const countMatches = (text, re) => {
        const m = text.match(re);
        return m ? m.length : 0;
      };

      const stats = wordsRows.map((wordRow) => {
        const wordOptions = {
          useDeclensions: wordRow.use_declensions,
          declensionPatterns: wordRow.declension_patterns || [],
          stemmingEnabled: wordRow.stemming_enabled
        };
        const allWordForms = getAllWordForms(wordRow.word, wordOptions);
        const regex = createDeclensionRegex(wordRow.word, allWordForms.slice(1));

        let total = 0;
        for (const content of contents) {
          total += countMatches(content, regex);
        }
        return { word: wordRow.word, count: total, declensions: allWordForms.length - 1 };
      });

      res.json({ totalArticles: contents.length, stats });
    } catch (err) {
      console.error('Failed to compute word stats:', err?.message || err);
      res.status(500).json({ error: 'Failed to compute word stats' });
    }
  });

  console.log('Registering word appearances route...');
  app.get('/api/words/:id/appearances', async (req, res) => {
    try {
      console.log('Word appearances endpoint called with id:', req.params.id);
      const wordId = parseInt(req.params.id, 10);
      if (!Number.isFinite(wordId) || wordId <= 0) {
        return res.status(400).json({ error: 'Invalid word id' });
      }

      // Get the word details
      const word = await getWordById(wordId);
      if (!word) {
        return res.status(404).json({ error: 'Word not found' });
      }

      // Get articles with their content
      const articles = await listArticles(1000); // Get more articles for better search

      // Get all forms of the word (including declensions)
      const wordOptions = {
        useDeclensions: word.use_declensions,
        declensionPatterns: word.declension_patterns || [],
        stemmingEnabled: word.stemming_enabled
      };
      const allWordForms = getAllWordForms(word.word, wordOptions);

      // Create regex that matches any form of the word
      const regex = createDeclensionRegex(word.word, allWordForms.slice(1)); // slice(1) to exclude original word which is already in regex

      const appearances = articles
        .map((article) => {
          const matches = article.content ? article.content.match(regex) : null;
          if (!matches) return null;

          // Get context around each match (up to 200 chars before and after)
          const contexts = [];
          let lastIndex = 0;
          for (const match of matches) {
            const matchIndex = article.content.indexOf(match, lastIndex);
            if (matchIndex === -1) continue;

            const start = Math.max(0, matchIndex - 100);
            const end = Math.min(article.content.length, matchIndex + match.length + 100);
            const context = article.content.substring(start, end);

            contexts.push({
              text: context,
              position: matchIndex
            });

            lastIndex = matchIndex + match.length;
          }

          return {
            article: {
              id: article.id,
              title: article.title,
              url: article.url,
              created_at: article.created_at
            },
            count: matches.length,
            contexts: contexts.slice(0, 5) // Limit to 5 contexts per article
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.count - a.count); // Sort by count descending

      res.json({
        word,
        totalArticles: appearances.length,
        appearances
      });
    } catch (err) {
      console.error('Failed to get word appearances:', err?.message || err);
      res.status(500).json({ error: 'Failed to get word appearances' });
    }
  });
}

module.exports = { registerWordsRoutes };


