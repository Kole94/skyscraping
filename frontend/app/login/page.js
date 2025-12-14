'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('Signing in...');
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Login failed');
      }
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      try {
        window.dispatchEvent(new Event('auth-changed'));
      } catch {}
      setStatus('Signed in successfully');
    } catch (err) {
      setStatus(err.message || 'Failed');
    }
  }

  return (
    <main>
      <h1 style={{ margin: '0 0 12px' }}>Login</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
        <button type="submit">Sign in</button>
      </form>
      {status ? <p style={{ color: '#555', marginTop: 12 }}>{status}</p> : null}
    </main>
  );
}


