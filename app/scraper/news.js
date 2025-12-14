const cheerio = require('cheerio');
const { fetchHtml } = require('./fetchHtml');
const { normalizeUrl, cleanText, dedupeBy, getMeta, extractArticleText } = require('./utils');
const { mapWithConcurrency } = require('./concurrency');

const SOURCE_URL = 'https://n1info.rs/vesti/';

async function fetchN1NewsList() {
  const html = await fetchHtml(SOURCE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SkyscrapingBot/1.0; +https://example.com/bot)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9,sr;q=0.8',
    },
    timeoutMs: 15000,
  });

  const $ = cheerio.load(html);
  const items = [];

  $('article').each((_, el) => {
    const linkEl = $(el).find('h2 a, h3 a').first();
    const href = normalizeUrl(linkEl.attr('href'), SOURCE_URL);
    const title = cleanText(linkEl.text() || '');
    if (href && title) {
      const timeEl = $(el).find('time').first();
      const published = cleanText(timeEl.attr('datetime') || timeEl.text() || '');
      items.push({
        title,
        url: href,
        source: 'N1 Info RS',
        category: 'Vesti',
        published: published || null,
      });
    }
  });

  if (items.length < 10) {
    $('h2 a, h3 a').each((_, el) => {
      const href = normalizeUrl($(el).attr('href'), SOURCE_URL);
      const title = cleanText($(el).text() || '');
      if (href && title) {
        items.push({
          title,
          url: href,
          source: 'N1 Info RS',
          category: 'Vesti',
          published: null,
        });
      }
    });
  }

  return dedupeBy(items, (i) => i.url).slice(0, 50);
}

async function fetchArticleDetails(url) {
  const html = await fetchHtml(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SkyscrapingBot/1.0; +https://example.com/bot)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9,sr;q=0.8',
    },
    timeoutMs: 15000,
  });
  const $ = cheerio.load(html);
  const title = cleanText($('h1').first().text() || '') || null;
  const published =
    $('time').first().attr('datetime') ||
    cleanText($('time').first().text() || '') ||
    getMeta($, 'article:published_time', 'property') ||
    null;
  const author =
    cleanText($('[rel~="author"], .author, .article-author').first().text() || '') || null;
  const description =
    getMeta($, 'og:description', 'property') ||
    cleanText($('p').first().text() || '') ||
    null;
  const category =
    getMeta($, 'article:section', 'property') ||
    cleanText($('.breadcrumbs a').eq(1).text() || '') ||
    'Vesti';
  const mainImage = getMeta($, 'og:image', 'property') || null;
  const tags = [];
  $('a[rel~="tag"], .tags a').each((_, a) => {
    const t = cleanText($(a).text() || '');
    if (t) tags.push(t);
  });
  const content = extractArticleText($, $('article'));
  return {
    title,
    published: published ? cleanText(String(published)) : null,
    author,
    description,
    category,
    mainImage,
    tags: tags.length ? Array.from(new Set(tags)) : [],
    content,
  };
}

async function fetchN1NewsWithContent(list, { concurrency = 5 } = {}) {
  const enriched = await mapWithConcurrency(list, concurrency, async (item) => {
    const details = await fetchArticleDetails(item.url);
    return { ...item, ...details };
  });
  return enriched;
}

module.exports = {
  SOURCE_URL,
  fetchN1NewsList,
  fetchArticleDetails,
  fetchN1NewsWithContent,
};


