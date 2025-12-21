import Link from 'next/link';

async function fetchWords() {
  const base = process.env.BACKEND_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/words`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch words');
  }
  return res.json();
}

async function fetchWordStats() {
  const base = process.env.BACKEND_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/words/stats?limit=20`, { cache: 'no-store' });
  if (!res.ok) {
    return { stats: [] };
  }
  return res.json();
}

export default async function HomePage() {
  let data = { items: [] };
  let stats = { stats: [] };
  try {
    data = await fetchWords();
  } catch (e) {
    // ignore for simple rendering
  }
  try {
    stats = await fetchWordStats();
  } catch (e) {
    // ignore stats errors
  }

  const wordToCount = new Map((stats.stats || []).map((s) => [String(s.word || ''), Number(s.count || 0)]));

  return (
    <main>
      <h1 style={{ margin: '0 0 12px' }}>Words</h1>
      <p style={{ color: '#666', margin: '0 0 16px' }}>
        Showing {data.items?.length || 0} words from the backend.
      </p>
      {/* Client-side form shows only if authed (checks localStorage token) */}
      {/**/}
      {/**/}
      <div>
        {(() => {
          // Dynamically import client component at runtime (keeps page as server component)
          return null;
        })()}
      </div>
      {/* Use a client wrapper via dynamic import in a separate file if needed */}
      {/* Simpler: render the client component directly; Next will handle it */}
      <div>
        {require('react').createElement(require('../components/AddWordForm').default)}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {(data.items || []).map((w) => (
          <li key={w.id} style={{ padding: '10px 12px', marginBottom: 8, background: 'white', border: '1px solid #eee', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link
                href={`/word/${w.id}`}
                style={{ color: '#0070f3', textDecoration: 'none', flex: 1 }}
              >
                <span>{w.word}</span>
              </Link>
              <span style={{ fontSize: 12, color: '#555', background: '#f1f1f1', borderRadius: 999, padding: '2px 8px' }}>
                {wordToCount.get(String(w.word)) || 0}
              </span>
              <span style={{ marginLeft: 'auto' }}>
                {require('react').createElement(require('../components/DeleteWordButton').default, { wordId: w.id })}
              </span>
            </div>
            {w.user_name ? (
              <div style={{ color: '#888', fontSize: 12 }}>by {w.user_name}</div>
            ) : null}
            <div style={{ color: '#aaa', fontSize: 12 }}>{new Date(w.created_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}


