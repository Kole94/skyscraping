// Configure DB connection to match docker-compose (host-mapped 5434)
process.env.PGHOST = process.env.PGHOST || 'localhost';
process.env.PGPORT = process.env.PGPORT || '5434';
process.env.PGUSER = process.env.PGUSER || 'appuser';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'apppass';
process.env.PGDATABASE = process.env.PGDATABASE || 'appdb';

const {
  initDb,
  pool,
  createUser,
  listUsers,
  addWord,
  listUserWords,
} = require('../app/db');

describe('Users and Words one-to-many relationship', () => {
  let user;
  const uniqueName = `test_user_${Date.now()}`;

  beforeAll(async () => {
    await initDb();
  });

  afterAll(async () => {
    if (user && user.id) {
      await pool.query('DELETE FROM users WHERE id = $1', [user.id]); // cascades to words
    }
    await pool.end();
  });

  test('create user, add words, and list them', async () => {
    // create a user
    user = await createUser(uniqueName);
    expect(user).toBeTruthy();
    expect(user.id).toBeDefined();
    expect(user.name).toBe(uniqueName);

    // verify the user is returned by listUsers
    const users = await listUsers(100);
    const foundUser = users.find((u) => u.id === user.id);
    expect(foundUser).toBeTruthy();

    // add words for this user
    const w1 = await addWord(user.id, 'alpha');
    const w2 = await addWord(user.id, 'beta');
    expect(w1).toBeTruthy();
    expect(w2).toBeTruthy();
    expect(w1.user_id).toBe(user.id);
    expect(w2.user_id).toBe(user.id);

    // list words and validate presence
    const words = await listUserWords(user.id, 10);
    const wordTexts = words.map((w) => w.word).sort();
    expect(wordTexts).toEqual(expect.arrayContaining(['alpha', 'beta']));
  });

  test('cascade delete removes words', async () => {
    // ensure we have a user from the previous test
    expect(user && user.id).toBeTruthy();

    // delete the user and confirm words are gone
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
    const wordsAfterDelete = await pool.query('SELECT COUNT(*)::int AS cnt FROM words WHERE user_id = $1', [user.id]);
    expect(wordsAfterDelete.rows[0].cnt).toBe(0);

    // recreate user for afterAll cleanup to be no-op-safe
    user = await createUser(`${uniqueName}_recreated`);
  });
});


