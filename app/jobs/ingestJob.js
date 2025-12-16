const { fetchN1NewsList, fetchN1NewsWithContent } = require('../scraper');
const { upsertArticles } = require('../db');

function startIngestScheduler({ intervalMs, limit, concurrency }) {
  const interval = Number(intervalMs) || 5 * 60 * 1000;
  const ingestLimit = Number(limit) || 20;
  const ingestConcurrency = Number(concurrency) || 5;
  let ingestRunning = false;

  async function ingestOnce() {
    if (ingestRunning) return;
    ingestRunning = true;
    try {
      console.log(
        `[ingest] run at=${new Date().toISOString()} intervalMs=${interval} limit=${ingestLimit} concurrency=${ingestConcurrency}`
      );
      const list = await fetchN1NewsList();
      const sliced = list.slice(0, ingestLimit);
      const items = await fetchN1NewsWithContent(sliced, { concurrency: ingestConcurrency });
      const minimal = items
        .map((i) => ({
          title: i.title,
          url: i.url,
          content: i.content || '',
        }))
        .filter((i) => i.title && i.url && i.content);
      const result = await upsertArticles(minimal);
      console.log(
        `[ingest] requested=${sliced.length} scraped=${items.length} saved=${result.upserted}`
      );
    } catch (e) {
      console.error('[ingest] failed:', e?.message || e);
    } finally {
      ingestRunning = false;
    }
  }

  // Kick off immediately and then schedule
  console.log(
    `[ingest] scheduler started intervalMs=${interval} limit=${ingestLimit} concurrency=${ingestConcurrency}`
  );
  ingestOnce();
  const timer = setInterval(ingestOnce, interval);
  return { stop: () => clearInterval(timer) };
}

module.exports = { startIngestScheduler };


