const cheerio = require('cheerio');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const SOURCE_URL = 'https://n1info.rs/vesti/';

function fetchHtml(urlString, { headers = {}, timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlString);
    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Request failed with status ${res.statusCode}`));
          res.resume();
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Request timed out'));
    });
    req.end();
  });
}

function normalizeUrl(href) {
  try {
    return new URL(href, SOURCE_URL).toString();
  } catch {
    return null;
  }
}

function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function dedupeBy(arr, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of arr) {
    const key = keyFn(item);
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function getMeta($, name, attr = 'name') {
  return (
    $(`meta[${attr}="${name}"]`).attr('content') ||
    $(`meta[property="${name}"]`).attr('content') ||
    null
  );
}

function extractArticleText($, root) {
  const $root = root && root.length ? root : $('article, .article, .single, .content, .post').first();
  if (!$root || !$root.length) {
    return null;
  }
  const paragraphs = [];
  $root.find('p').each((_, p) => {
    const txt = cleanText($(p).text() || '');
    if (txt) paragraphs.push(txt);
  });
  const text = cleanText(paragraphs.join('\n'));
  return text || null;
}

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

  // Strategy 1: article elements with h2/h3 anchors
  $('article').each((_, el) => {
    const linkEl = $(el).find('h2 a, h3 a').first();
    const href = normalizeUrl(linkEl.attr('href'));
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

  // Strategy 2: fallback to prominent heading links if needed
  if (items.length < 10) {
    $('h2 a, h3 a').each((_, el) => {
      const href = normalizeUrl($(el).attr('href'));
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

  // Deduplicate and limit
  const unique = dedupeBy(items, (i) => i.url).slice(0, 50);
  return unique;
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

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = new Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
    while (true) {
      const current = nextIndex++;
      if (current >= items.length) return;
      try {
        results[current] = await mapper(items[current], current);
      } catch (err) {
        results[current] = { error: err && err.message ? err.message : 'Unknown error' };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function fetchN1NewsWithContent(list, { concurrency = 5 } = {}) {
  const enriched = await mapWithConcurrency(list, concurrency, async (item) => {
    const details = await fetchArticleDetails(item.url);
    return {
      ...item,
      ...details,
    };
  });
  return enriched;
}

module.exports = {
  fetchN1NewsList,
  fetchN1NewsWithContent,
  fetchArticleDetails,
  SOURCE_URL,
};


