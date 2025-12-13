const express = require('express');
const { fetchN1NewsList, fetchN1NewsWithContent } = require('./scraper');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Server is up');
});

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

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

