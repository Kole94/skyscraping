const { URL } = require('url');

function normalizeUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
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

module.exports = {
  normalizeUrl,
  cleanText,
  dedupeBy,
  getMeta,
  extractArticleText,
};


