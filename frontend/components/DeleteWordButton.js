'use client';

import { useEffect, useState } from 'react';

export default function DeleteWordButton({ wordId }) {
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      setAuthed(!!token);
    } catch {
      setAuthed(false);
    }
  }, []);

  if (!authed) return null;

  async function onDelete() {
    if (busy) return;
    setBusy(true);
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${base}/api/words/${wordId}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Delete failed');
      }
      window.location.reload();
    } catch (e) {
      alert(e.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={onDelete} disabled={busy} style={{ cursor: 'pointer' }}>
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  );
}


