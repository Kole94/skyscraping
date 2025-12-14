const request = require('supertest');

// Point to host Postgres exposed by docker-compose
process.env.PGHOST = process.env.PGHOST || 'localhost';
process.env.PGPORT = process.env.PGPORT || '5434';
process.env.PGUSER = process.env.PGUSER || 'appuser';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'apppass';
process.env.PGDATABASE = process.env.PGDATABASE || 'appdb';

// Mock scraper to avoid network dependency
jest.mock('../app/scraper', () => {
  return {
    fetchN1NewsList: jest.fn().mockResolvedValue([
      { title: 'Test Article', url: 'https://example.com/test-article-1', source: 'Test', category: 'Vesti', published: null },
    ]),
    fetchN1NewsWithContent: jest.fn().mockResolvedValue([
      {
        title: 'Test Article',
        url: 'https://example.com/test-article-1',
        source: 'Test',
        category: 'Vesti',
        published: null,
        content: 'This is the test content for article 1.',
      },
    ]),
  };
});

const { initDb, pool } = require('../app/db');
const { app } = require('../app/server');

describe('News ingestion and persistence', () => {
  beforeAll(async () => {
    await initDb();
    await pool.query(`DELETE FROM articles WHERE url = $1`, ['https://example.com/test-article-1']);
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM articles WHERE url = $1`, ['https://example.com/test-article-1']);
    await pool.end();
  });

  test('ingest endpoint saves articles and articles endpoint returns them', async () => {
    const ingestRes = await request(app).get('/api/news/ingest?limit=1');
    expect(ingestRes.status).toBe(200);
    expect(ingestRes.body).toHaveProperty('saved');
    expect(ingestRes.body.saved).toBeGreaterThanOrEqual(1);

    const listRes = await request(app).get('/api/articles?limit=5');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveProperty('items');
    const found = listRes.body.items.find((it) => it.url === 'https://example.com/test-article-1');
    expect(found).toBeTruthy();
    expect(found.title).toBe('Test Article');
    expect(typeof found.content).toBe('string');
    expect(found.content.length).toBeGreaterThan(0);
  });
});


