'use client';

import { useEffect, useState } from 'react';

export default function AddWordForm() {
  const [authed, setAuthed] = useState(false);
  const [word, setWord] = useState('');
  const [status, setStatus] = useState(null);
  const [useDeclensions, setUseDeclensions] = useState(false);
  const [declensionPatterns, setDeclensionPatterns] = useState('');
  const [stemmingEnabled, setStemmingEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        body: JSON.stringify({
          word,
          useDeclensions,
          declensionPatterns: declensionPatterns ? declensionPatterns.split(',').map(s => s.trim()).filter(Boolean) : [],
          stemmingEnabled
        }),
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
    <div style={{ marginBottom: 16 }}>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="New word" required />
        <button type="submit">Add</button>
        {status ? <span style={{ color: '#777' }}>{status}</span> : null}
      </form>

      <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'none',
            border: 'none',
            color: '#0070f3',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
            fontSize: '12px'
          }}
        >
          {showAdvanced ? 'Hide' : 'Show'} Serbian declension options
        </button>
      </div>

      {showAdvanced && (
        <div style={{
          border: '1px solid #eee',
          borderRadius: '4px',
          padding: '12px',
          background: '#fafafa',
          fontSize: '14px'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                checked={useDeclensions}
                onChange={(e) => setUseDeclensions(e.target.checked)}
              />
              Enable Serbian declensions
            </label>
          </div>

          {useDeclensions && (
            <>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#555' }}>
                  Custom declension patterns (comma-separated):
                </label>
                <input
                  value={declensionPatterns}
                  onChange={(e) => setDeclensionPatterns(e.target.value)}
                  placeholder="Dragan, Dragana, Draganu, Dragana, Draganom, Draganu"
                  style={{ width: '100%', fontSize: '12px', padding: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={stemmingEnabled}
                    onChange={(e) => setStemmingEnabled(e.target.checked)}
                  />
                  <span style={{ fontSize: '12px' }}>Enable automatic stemming</span>
                </label>
              </div>

              <div style={{ fontSize: '11px', color: '#777', marginTop: '8px' }}>
                If no custom patterns are provided, the system will automatically generate common Serbian declensions.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}


