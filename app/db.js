const { Pool } = require('pg');

const pool = new Pool({
  // Uses PG* env vars or DATABASE_URL if present
  // PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE are already set in docker-compose
  max: 10,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 10000,
});

async function initDb() {
  const client = await pool.connect();
  try {
    // Users (one)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    // Auth columns (optional; present for email/password auth)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_email ON users (email)`);

    // Words (many) - each word belongs to a user
    await client.query(`
      CREATE TABLE IF NOT EXISTS words (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        word TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_words_user_id ON words (user_id)`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles (created_at DESC)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_url ON articles (url)`);
  } finally {
    client.release();
  }
}

async function upsertArticles(articles) {
  if (!Array.isArray(articles) || articles.length === 0) return { upserted: 0 };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let upserted = 0;
    for (const article of articles) {
      const { title, url, content } = article;
      if (!title || !url || !content) continue;
      await client.query(
        `
          INSERT INTO articles (title, url, content)
          VALUES ($1, $2, $3)
          ON CONFLICT (url) DO UPDATE
            SET title = EXCLUDED.title,
                content = EXCLUDED.content
        `,
        [title, url, content]
      );
      upserted += 1;
    }
    await client.query('COMMIT');
    return { upserted };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listArticles(limit = 20) {
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const { rows } = await pool.query(
    `SELECT id, title, url, content, created_at FROM articles ORDER BY created_at DESC LIMIT $1`,
    [lim]
  );
  return rows;
}

async function listArticleContents(limit = 50) {
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 1000);
  const { rows } = await pool.query(
    `SELECT content FROM articles ORDER BY created_at DESC LIMIT $1`,
    [lim]
  );
  return rows.map((r) => r.content || '');
}
async function createUser(name) {
  const { rows } = await pool.query(
    `INSERT INTO users (name) VALUES ($1) RETURNING id, name, created_at`,
    [name]
  );
  return rows[0] || null;
}

async function listUsers(limit = 50) {
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const { rows } = await pool.query(
    `SELECT id, name, created_at FROM users ORDER BY created_at DESC LIMIT $1`,
    [lim]
  );
  return rows;
}

async function addWord(userId, word) {
  const { rows } = await pool.query(
    `INSERT INTO words (user_id, word) VALUES ($1, $2) RETURNING id, user_id, word, created_at`,
    [userId, word]
  );
  return rows[0] || null;
}

async function listUserWords(userId, limit = 50) {
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 500);
  const { rows } = await pool.query(
    `SELECT id, word, created_at FROM words WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, lim]
  );
  return rows;
}

async function listAllWords(limit = 200) {
  const lim = Math.min(Math.max(Number(limit) || 200, 1), 1000);
  const { rows } = await pool.query(
    `SELECT w.id, w.word, w.created_at, u.id AS user_id, u.name AS user_name
     FROM words w
     LEFT JOIN users u ON u.id = w.user_id
     ORDER BY w.created_at DESC
     LIMIT $1`,
    [lim]
  );
  return rows;
}

async function deleteWordById(wordId, userId) {
  const { rows } = await pool.query(
    `DELETE FROM words WHERE id = $1 AND user_id = $2 RETURNING id`,
    [wordId, userId]
  );
  return rows.length > 0;
}
async function createUserAuth(name, email, passwordHash) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
  );
  return rows[0] || null;
}

async function getUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function getUserById(id) {
  const { rows } = await pool.query(
    `SELECT id, name, email, created_at FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  initDb,
  upsertArticles,
  listArticles,
  listArticleContents,
  createUser,
  listUsers,
  addWord,
  listUserWords,
  listAllWords,
  createUserAuth,
  getUserByEmail,
  getUserById,
  deleteWordById,
  pool,
};


