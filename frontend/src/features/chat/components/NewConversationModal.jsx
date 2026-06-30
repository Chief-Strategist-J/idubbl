import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Users, User, CheckCircle2, ArrowRight, ArrowLeft, Camera } from 'lucide-react';
import useChatStore from '../../../shared/store/chatStore.js';

export default function NewConversationModal({ onClose, onConversationCreated }) {
  const [tab, setTab] = useState('direct');
  const [step, setStep] = useState('select'); // 'select' -> 'name' (group only)
  const [query, setQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { users, fetchUsers, createDirect, createGroup } = useChatStore();
  const debounceRef = useRef(null);
  const [showAllSelected, setShowAllSelected] = useState(false);
  const [showAllSelectedName, setShowAllSelectedName] = useState(false);
  const groupNameRef = useRef(null);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    if (step === 'name') groupNameRef.current?.focus();
  }, [step]);

  const getUserId = (user) => user.id ?? user._id;

  function toggleUser(user) {
    setSelected(s =>
      s.some(u => getUserId(u) === getUserId(user))
        ? s.filter(u => getUserId(u) !== getUserId(user))
        : [...s, user]
    );
  }

  function switchTab(key) {
    setTab(key);
    setStep('select');
    setSelected([]);
    setGroupName('');
    setError('');
    setShowAllSelected(false);
    setShowAllSelectedName(false);
  }

  async function handleCreate() {
    const validationError =
      tab === 'direct'
        ? (selected.length !== 1 ? 'Select exactly one user.' : '')
        : (!groupName.trim() ? 'Group name is required.' : selected.length < 1 ? 'Select at least one member.' : '');

    if (validationError) { setError(validationError); return; }

    setError('');
    setCreating(true);
    try {
      const conv = tab === 'direct'
        ? await createDirect(getUserId(selected[0]))
        : await createGroup(groupName.trim(), selected.map(getUserId));
      onConversationCreated(conv);
    } catch (err) {
      setError(err.message || 'Failed to create conversation.');
    }
    setCreating(false);
  }

  const isNameStep = tab === 'group' && step === 'name';

  return (
    <div className="chat-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="chat-modal">
        <div className="chat-modal-header">
          {isNameStep ? (
            <button className="chat-icon-btn" onClick={() => setStep('select')}>
              <ArrowLeft size={20} />
            </button>
          ) : (
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>New Conversation</span>
          )}
          {isNameStep && (
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>New Group</span>
          )}
          <button className="chat-icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* ---------------- STEP 1: pick a direct user OR pick group members ---------------- */}
        {!isNameStep && (
          <>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
              {[
                { key: 'direct', label: 'Direct', icon: User },
                { key: 'group', label: 'Group', icon: Users }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => switchTab(key)}
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

            {/* Selected users badges — scrolls instead of growing unbounded once expanded */}
            {selected.length > 0 && tab === 'group' && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignContent: 'flex-start',
                  gap: '0.4rem',
                  marginBottom: '0.75rem',
                  maxHeight: showAllSelected ? 200 : 'none',
                  overflowY: showAllSelected ? 'auto' : 'visible',
                  paddingRight: 0,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
                className="chat-selected-badges-scroll"
              >
                {(showAllSelected ? selected : selected.slice(0, 3)).map(u => (
                  <span key={getUserId(u)} style={{
                    background: 'var(--primary)', color: 'var(--text-on-primary)',
                    borderRadius: '999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0
                  }}>
                    {u.name || u.email}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleUser(u)} />
                  </span>
                ))}
                {!showAllSelected && selected.length > 3 && (
                  <span
                    onClick={() => setShowAllSelected(true)}
                    style={{
                      background: 'rgba(0, 227, 122, 0.14)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(0, 227, 122, 0.22)',
                      borderRadius: '999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'pointer', flexShrink: 0
                    }}
                  >
                    +{selected.length - 3} more
                  </span>
                )}
              </div>
            )}

            {showAllSelected && selected.length > 3 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.4rem', marginBottom: '0.6rem' }}>
                <span
                  onClick={() => setShowAllSelected(false)}
                  style={{ fontSize: '0.76rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Show less
                </span>
              </div>
            )}

            <div className="chat-modal-user-list">
              {users.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.88rem' }}>
                  No users found
                </div>
              )}
              {users.map(user => {
                const isSelected = selected.some(u => getUserId(u) === getUserId(user));
                return (
                  <button
                    key={getUserId(user)}
                    className={`chat-modal-user-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => tab === 'direct' ? setSelected([user]) : toggleUser(user)}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-on-primary)', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                    }}>
                      {(user.name || user.email || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{user.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    </div>
                    {isSelected && <CheckCircle2 size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {error && <div style={{ color: 'var(--accent-red)', fontSize: '0.82rem', marginTop: '0.5rem' }}>{error}</div>}

            {/* Direct tab: create immediately. Group tab: arrow button advances to naming step (WhatsApp-style). */}
            {tab === 'direct' ? (
              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={handleCreate}
                disabled={creating || selected.length === 0}
              >
                {creating ? 'Creating…' : 'Start Chat'}
              </button>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button
                  onClick={() => selected.length > 0 ? setStep('name') : setError('Select at least one member.')}
                  style={{
                    width: 48, height: 48, borderRadius: '50%', border: 'none',
                    background: selected.length === 0 ? 'var(--border)' : 'var(--primary)',
                    color: 'var(--text-on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: selected.length === 0 ? 'none' : '0 2px 10px rgba(0, 227, 122, 0.35)',
                    transition: 'all 0.2s'
                  }}
                  aria-label="Next: name your group"
                  title="Next"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            )}
          </>
        )}

        {/* ---------------- STEP 2: name the group (WhatsApp-style) ---------------- */}
        {isNameStep && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', margin: '0.5rem 0 1.25rem' }}>
              <div style={{
                width: 84, height: 84, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-on-primary)', position: 'relative'
              }}>
                <Camera size={26} />
                <div style={{
                  position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--bg-darker)', border: '2px solid var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Users size={13} style={{ color: 'var(--primary)' }} />
                </div>
              </div>

              <input
                ref={groupNameRef}
                className="chat-search-input"
                placeholder="Group name…"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                style={{
                  marginBottom: 0, textAlign: 'center', width: '100%',
                  border: error && !groupName.trim() ? '1px solid var(--accent-red)' : undefined
                }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {selected.length} member{selected.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            {/* Member badges on the naming step — collapses to "+N more" / scrolls when expanded */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                gap: '0.4rem',
                marginBottom: showAllSelectedName && selected.length > 4 ? '0.4rem' : '1rem',
                maxHeight: showAllSelectedName ? 210 : 'none',
                overflowY: showAllSelectedName ? 'auto' : 'visible',
                paddingRight: 0,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              className="chat-selected-badges-scroll"
            >
              {(showAllSelectedName ? selected : selected.slice(0, 4)).map(u => (
                <span key={getUserId(u)} style={{
                  background: 'var(--primary)', color: 'var(--text-on-primary)',
                  borderRadius: '999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0
                }}>
                  {u.name || u.email}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleUser(u)} />
                </span>
              ))}
              {!showAllSelectedName && selected.length > 4 && (
                <span
                  onClick={() => setShowAllSelectedName(true)}
                  style={{
                    background: 'rgba(0, 227, 122, 0.14)',
                    color: 'var(--primary)',
                    border: '1px solid rgba(0, 227, 122, 0.22)',
                    borderRadius: '999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600,
                    cursor: 'pointer', flexShrink: 0
                  }}
                >
                  +{selected.length - 4} more
                </span>
              )}
            </div>

            {showAllSelectedName && selected.length > 4 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.85rem' }}>
                <span
                  onClick={() => setShowAllSelectedName(false)}
                  style={{ fontSize: '0.76rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Show less
                </span>
              </div>
            )}

            {error && <div style={{ color: 'var(--accent-red)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>{error}</div>}

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '0.25rem' }}
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Create Group'}
            </button>
          </>
        )}
      </div>

      {/* Webkit scrollbar styling for the badge containers (Firefox handled via inline scrollbarWidth/Color) */}
      <style>{`
        .chat-selected-badges-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}