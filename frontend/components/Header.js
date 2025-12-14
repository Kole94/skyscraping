'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    function syncAuth() {
      try {
        const token = localStorage.getItem('token');
        setAuthed(!!token);
      } catch {
        setAuthed(false);
      }
    }
    syncAuth();
    const onAuthChanged = () => syncAuth();
    const onFocus = () => syncAuth();
    window.addEventListener('auth-changed', onAuthChanged);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('auth-changed', onAuthChanged);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  function logout() {
    try {
      localStorage.removeItem('token');
      setAuthed(false);
      window.dispatchEvent(new Event('auth-changed'));
    } catch {}
  }

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', marginBottom: 16, borderBottom: '1px solid #eee' }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ fontWeight: 700, textDecoration: 'none', color: '#111' }}>Skyscraping</Link>
        <Link href="/" style={{ textDecoration: 'none', color: '#333' }}>Words</Link>
      </nav>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!authed ? (
          <>
            <Link href="/login" style={{ textDecoration: 'none' }}>Login</Link>
            <Link href="/register" style={{ textDecoration: 'none' }}>Register</Link>
          </>
        ) : (
          <>
            <button onClick={logout} style={{ cursor: 'pointer' }}>Logout</button>
          </>
        )}
      </nav>
    </header>
  );
}


