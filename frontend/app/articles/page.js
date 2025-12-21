async function fetchArticles() {
  const base = process.env.BACKEND_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/articles?limit=500`, { cache: 'no-store' });
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
              <div style={{ color: '#888', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                {a.url?.startsWith('https://n1info.rs') && (
                  <img src="/images/n1.png" alt="N1 Info RS" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                )}
                {a.url?.startsWith('https://informer.rs') && (
                  <img src="/images/informer.png" alt="Informer.rs" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                )}
                {a.source} {a.category ? `· ${a.category}` : ''}
              </div>
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


