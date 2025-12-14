'use client';

import { useEffect, useState } from 'react';

export default function AddWordForm() {
  const [authed, setAuthed] = useState(false);
  const [word, setWord] = useState('');
  const [status, setStatus] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      setAuthed(!!token);
    } catch {
      setAuthed(false);
    }
  }, []);

  if (!authed) return null;

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${base}/api/words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ word }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to add word');
      }
      setWord('');
      setStatus('Added');
      // simple refresh to show in list
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      setStatus(err.message || 'Failed');
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="New word" required />
      <button type="submit">Add</button>
      {status ? <span style={{ color: '#777' }}>{status}</span> : null}
    </form>
  );
}


