import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Users, User, Check } from 'lucide-react';
import useChatStore from '../../../shared/store/chatStore.js';

export default function NewConversationModal({ onClose, onConversationCreated }) {
  const [tab, setTab] = useState('direct');
  const [query, setQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { users, fetchUsers, createDirect, createGroup } = useChatStore();
  const debounceRef = useRef(null);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function toggleUser(user) {
    setSelected(s =>
      s.some(u => u.id === user.id)
        ? s.filter(u => u.id !== user.id)
        : [...s, user]
    );
  }

  async function handleCreate() {
    setError('');
    setCreating(true);
    try {
      let conv;
      if (tab === 'direct') {
        if (selected.length !== 1) { setError('Select exactly one user.'); setCreating(false); return; }
        conv = await createDirect(selected[0].id);
      } else {
        if (!groupName.trim()) { setError('Group name is required.'); setCreating(false); return; }
        if (selected.length < 1) { setError('Select at least one member.'); setCreating(false); return; }
        conv = await createGroup(groupName.trim(), selected.map(u => u.id));
      }
      onConversationCreated(conv);
    } catch (err) {
      setError(err.message || 'Failed to create conversation.');
    }
    setCreating(false);
  }

  return (
    <div className="chat-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="chat-modal">
        <div className="chat-modal-header">
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>New Conversation</span>
          <button className="chat-icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          {[
            { key: 'direct', label: 'Direct', icon: User },
            { key: 'group', label: 'Group', icon: Users }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSelected([]); }}
              style={{
                flex: 1, padding: '0.65rem', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
                color: tab === key ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: tab === key ? 600 : 400, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem', transition: 'all 0.2s'
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {tab === 'group' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <input
              className="chat-search-input"
              placeholder="Group name…"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
        )}

        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="chat-search-input"
            style={{ paddingLeft: '2.2rem', marginBottom: 0 }}
            placeholder="Search users…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {selected.length > 0 && tab === 'group' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {selected.map(u => (
              <span key={u.id} style={{
                background: 'var(--primary)', color: 'var(--bg-darker)',
                borderRadius: '999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.3rem'
              }}>
                {u.name || u.email}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleUser(u)} />
              </span>
            ))}
          </div>
        )}

        <div className="chat-modal-user-list">
          {users.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.88rem' }}>
              No users found
            </div>
          )}
          {users.map(user => {
            const isSelected = selected.some(u => u.id === user.id);
            return (
              <button
                key={user.id}
                className={`chat-modal-user-item ${isSelected ? 'selected' : ''}`}
                onClick={() => tab === 'direct' ? setSelected([user]) : toggleUser(user)}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--bg-darker)', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                }}>
                  {(user.name || user.email || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{user.name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                </div>
                {isSelected && <Check size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        {error && <div style={{ color: 'var(--accent-red)', fontSize: '0.82rem', marginTop: '0.5rem' }}>{error}</div>}

        <button
          className="btn-primary"
          style={{ width: '100%', marginTop: '1rem' }}
          onClick={handleCreate}
          disabled={creating || selected.length === 0}
        >
          {creating ? 'Creating…' : tab === 'direct' ? 'Start Chat' : 'Create Group'}
        </button>
      </div>
    </div>
  );
}
