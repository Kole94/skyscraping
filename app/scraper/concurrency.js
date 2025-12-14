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

module.exports = { mapWithConcurrency };


