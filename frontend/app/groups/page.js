'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

async function fetchGroups() {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`${base}/api/groups`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    credentials: 'include'
  });
  console.log(res);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Please login first');
    }
    throw new Error('Failed to fetch groups');
  }
  return res.json();
}

async function fetchWords() {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`${base}/api/words`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    credentials: 'include'
  });
  if (!res.ok) {
    throw new Error('Failed to fetch words');
  }
  return res.json();
}

async function createGroup(name, wordIds) {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`${base}/api/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    credentials: 'include',
    body: JSON.stringify({ name, wordIds }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create group');
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

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedWordIds, setSelectedWordIds] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [authed, setAuthed] = useState(false);
  console.log('dasdasdsa')

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
    if (authed) {
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [groupsData, wordsData] = await Promise.all([
        fetchGroups(),
        fetchWords()
      ]);
      setGroups(groupsData.items || []);
      setWords(wordsData.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      setCreating(true);
      await createGroup(newGroupName.trim(), Array.from(selectedWordIds));
      setNewGroupName('');
      setSelectedWordIds(new Set());
      setShowCreateForm(false);
      await loadData(); // Reload groups
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteGroup(groupId, groupName) {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      return;
    }

    try {
      await deleteGroup(groupId);
      await loadData(); // Reload groups
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleWordSelection(wordId) {
    const newSelected = new Set(selectedWordIds);
    if (newSelected.has(wordId)) {
      newSelected.delete(wordId);
    } else {
      newSelected.add(wordId);
    }
    setSelectedWordIds(newSelected);
  }

  if (!authed) {
    return (
      <main>
        <h1>Groups</h1>
        <p>Please <a href="/login">login</a> to manage groups.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main>
        <h1>Groups</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Groups</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </main>
    );
  }

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Groups</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '8px 16px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          {showCreateForm ? 'Cancel' : 'Create Group'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: '20px',
          marginBottom: '20px',
          background: '#f9f9f9'
        }}>
          <h3>Create New Group</h3>
          <form onSubmit={handleCreateGroup}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Group Name:
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Select Words ({selectedWordIds.size} selected):
              </label>
              <div style={{
                border: '1px solid #ccc',
                borderRadius: 4,
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '10px'
              }}>
                {words.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>No words available</p>
                ) : (
                  words.map((word) => (
                    <label key={word.id} style={{
                      display: 'block',
                      marginBottom: '5px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedWordIds.has(word.id)}
                        onChange={() => toggleWordSelection(word.id)}
                        style={{ marginRight: '8px' }}
                      />
                      {word.word}
                    </label>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={creating || !newGroupName.trim()}
              style={{
                padding: '10px 20px',
                background: creating ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: creating ? 'not-allowed' : 'pointer'
              }}
            >
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      )}

      <div>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Showing {groups.length} groups.
        </p>

        {groups.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No groups created yet. Click "Create Group" to get started.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {groups.map((group) => (
              <li key={group.id} style={{
                padding: '15px 18px',
                marginBottom: '10px',
                background: 'white',
                border: '1px solid #eee',
                borderRadius: 8
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <Link
                      href={`/groups/${group.id}`}
                      style={{
                        fontWeight: 600,
                        textDecoration: 'none',
                        color: '#0070f3',
                        fontSize: '18px'
                      }}
                    >
                      {group.name}
                    </Link>
                    <div style={{
                      color: '#666',
                      fontSize: '14px',
                      marginTop: '5px'
                    }}>
                      {group.word_count || 0} words • Created {new Date(group.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    style={{
                      padding: '6px 12px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
