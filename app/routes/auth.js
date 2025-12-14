const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createUserAuth, getUserByEmail, getUserById } = require('../db');

function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'dev-insecure-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [, token] = header.split(' ');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const secret = process.env.JWT_SECRET || 'dev-insecure-secret';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function registerAuthRoutes(app) {
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password } = req.body || {};
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email and password are required' });
      }
      const existing = await getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await createUserAuth(name.trim(), email.trim().toLowerCase(), passwordHash);
      const token = signToken({ userId: user.id, email: user.email, name: user.name });
      return res.status(201).json({ token, user });
    } catch (e) {
      console.error('register failed:', e?.message || e);
      return res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
      }
      const user = await getUserByEmail(email.trim().toLowerCase());
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const token = signToken({ userId: user.id, email: user.email, name: user.name });
      const safeUser = { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
      return res.json({ token, user: safeUser });
    } catch (e) {
      console.error('login failed:', e?.message || e);
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/api/me', requireAuth, async (req, res) => {
    try {
      const user = await getUserById(req.user.userId);
      if (!user) return res.status(404).json({ error: 'Not found' });
      return res.json({ user });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to load profile' });
    }
  });
}

module.exports = { registerAuthRoutes, requireAuth };


