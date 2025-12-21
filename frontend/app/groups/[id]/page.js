'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

async function fetchGroup(groupId) {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`${base}/api/groups/${groupId}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    credentials: 'include'
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Please login first');
    }
    if (res.status === 404) {
      throw new Error('Group not found');
    }
    throw new Error('Failed to fetch group');
  }
  return res.json();
}

async function deleteGroup(groupId) {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`${base}/api/groups/${groupId}`, {
    method: 'DELETE',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    credentials: 'include'
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete group');
  }
}

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [authed, setAuthed] = useState(false);

  const groupId = params.id;

  useEffect(() => {
    function checkAuth() {
      try {
        const token = localStorage.getItem('token');
        setAuthed(!!token);
      } catch {
        setAuthed(false);
      }
    }
    checkAuth();
    if (authed && groupId) {
      loadGroup();
    } else if (!authed) {
      setLoading(false);
    }
  }, [groupId]);

  async function loadGroup() {
    try {
      setLoading(true);
      const data = await fetchGroup(groupId);
      setGroup(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async   function handleDeleteGroup() {
    if (!confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      await deleteGroup(groupId);
      router.push('/groups');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  if (!authed) {
    return (
      <main>
        <h1>Group</h1>
        <p>Please <a href="/login">login</a> to view groups.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main>
        <h1>Group</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Group</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <Link href="/groups" style={{ color: '#0070f3', textDecoration: 'none' }}>
          ← Back to Groups
        </Link>
      </main>
    );
  }

  if (!group) {
    return (
      <main>
        <h1>Group Not Found</h1>
        <p>The requested group could not be found.</p>
        <Link href="/groups" style={{ color: '#0070f3', textDecoration: 'none' }}>
          ← Back to Groups
        </Link>
      </main>
    );
  }

  return (
    <main>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/groups" style={{ color: '#0070f3', textDecoration: 'none' }}>
          ← Back to Groups
        </Link>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0 }}>{group.name}</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>
            Created {new Date(group.created_at).toLocaleDateString()} •
            {group.words.length} words in this group
          </p>
        </div>
        <button
          onClick={handleDeleteGroup}
          disabled={deleting}
          style={{
            padding: '8px 16px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: deleting ? 'not-allowed' : 'pointer'
          }}
        >
          {deleting ? 'Deleting...' : 'Delete Group'}
        </button>
      </div>

      <div>
        <h2>Words in this Group</h2>

        {group.words.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            This group doesn't have any words yet.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {group.words.map((word) => (
              <li key={word.id} style={{
                padding: '12px 15px',
                marginBottom: '8px',
                background: 'white',
                border: '1px solid #eee',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <Link
                    href={`/word/${word.id}`}
                    style={{
                      fontWeight: 600,
                      textDecoration: 'none',
                      color: '#0070f3',
                      fontSize: '16px'
                    }}
                  >
                    {word.word}
                  </Link>
                  <div style={{
                    color: '#666',
                    fontSize: '12px',
                    marginTop: '2px'
                  }}>
                    Added {new Date(word.created_at).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
