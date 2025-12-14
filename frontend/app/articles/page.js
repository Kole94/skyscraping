async function fetchArticles() {
  const base = process.env.BACKEND_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/articles?limit=50`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch articles');
  }
  return res.json();
}

export default async function ArticlesPage() {
  let data = { items: [] };
  try {
    data = await fetchArticles();
  } catch {
    // ignore errors for simple rendering
  }

  return (
    <main>
      <h1 style={{ margin: '0 0 12px' }}>Articles</h1>
      <p style={{ color: '#666', margin: '0 0 16px' }}>
        Showing {data.items?.length || 0} articles.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {(data.items || []).map((a) => (
          <li key={a.url} style={{ padding: '12px 14px', marginBottom: 10, background: 'white', border: '1px solid #eee', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <a href={a.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, textDecoration: 'none', color: '#0a58ca' }}>
                {a.title}
              </a>
              <span style={{ color: '#aaa', fontSize: 12 }}>
                {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
              </span>
            </div>
            {a.source ? (
              <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                {a.source} {a.category ? `· ${a.category}` : ''}
              </div>
            ) : null}
            {a.content ? (
              <p style={{ margin: '8px 0 0', color: '#333', whiteSpace: 'pre-wrap' }}>
                {a.content.length > 300 ? `${a.content.slice(0, 300)}…` : a.content}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}


