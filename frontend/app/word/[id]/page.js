async function fetchWordAppearances(wordId) {
  const base = process.env.BACKEND_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/words/${wordId}/appearances`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch word appearances');
  }
  return res.json();
}

export default async function WordDetailPage({ params }) {
  const { id } = params;

  let data = { word: null, appearances: [], totalArticles: 0 };
  try {
    data = await fetchWordAppearances(id);
  } catch (e) {
    return (
      <main>
        <h1>Word Not Found</h1>
        <p>Unable to load word details. {process.env.NODE_ENV === 'development' ? e.message : ''}</p>
        <a href="/">← Back to words</a>
      </main>
    );
  }

  if (!data.word) {
    return (
      <main>
        <h1>Word Not Found</h1>
        <p>The requested word does not exist.</p>
        <a href="/">← Back to words</a>
      </main>
    );
  }

  return (
    <main>
      <div style={{ marginBottom: '20px' }}>
        <a href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>← Back to words</a>
      </div>

      <h1 style={{ margin: '0 0 8px' }}>
        "{data.word.word}"
      </h1>

      <div style={{ color: '#666', marginBottom: '20px' }}>
        <p>Added by {data.word.user_name || 'Unknown'} on {new Date(data.word.created_at).toLocaleDateString()}</p>
        <p>Found in {data.totalArticles} article{data.totalArticles !== 1 ? 's' : ''}</p>
      </div>

      {data.appearances.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic' }}>
          This word hasn't been found in any scraped articles yet.
        </p>
      ) : (
        <div>
          <h2 style={{ margin: '20px 0 12px' }}>Appearances</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.appearances.map((appearance, index) => (
              <div key={index} style={{
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '16px',
                background: 'white'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>
                    <a
                      href={appearance.article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0070f3', textDecoration: 'none' }}
                    >
                      {appearance.article.title}
                    </a>
                  </h3>
                  <div style={{ color: '#888', fontSize: '12px' }}>
                    {new Date(appearance.article.created_at).toLocaleDateString()} •
                    <span style={{
                      background: '#f1f1f1',
                      borderRadius: '999px',
                      padding: '2px 8px',
                      marginLeft: '8px',
                      fontSize: '11px'
                    }}>
                      {appearance.count} appearance{appearance.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {appearance.contexts.map((context, ctxIndex) => (
                  <div key={ctxIndex} style={{
                    background: '#f9f9f9',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    {context.text}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
