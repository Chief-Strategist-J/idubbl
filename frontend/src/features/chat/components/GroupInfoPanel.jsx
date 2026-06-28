import React, { useState, useEffect } from 'react';
import { X, Edit2, Check, UserPlus, UserMinus, LogOut, Users, Crown, Shield } from 'lucide-react';
import useChatStore from '../../../shared/store/chatStore.js';
import { getSocket } from '../../../shared/services/socketService.js';

function RoleBadge({ role }) {
  if (role === 'owner') return <Crown size={13} style={{ color: 'var(--accent-warning)' }} title="Owner" />;
  if (role === 'admin') return <Shield size={13} style={{ color: 'var(--secondary)' }} title="Admin" />;
  return null;
}

export default function GroupInfoPanel({ conversation, userId, onClose, onLeft }) {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(conversation.name || '');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState('');
  const { updateGroupName, addMembers, removeMember, leaveGroup, updateMemberRole, users, fetchUsers, onlineUsers } = useChatStore();

  const myRole = conversation.members?.find(m => m.userId === userId)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';
  const isOwner = myRole === 'owner';

  useEffect(() => { if (showAddMembers) fetchUsers(addQuery); }, [addQuery, showAddMembers]);

  const memberIds = new Set(conversation.members?.map(m => m.userId) || []);
  const nonMembers = users.filter(u => !memberIds.has(u.id));

  async function handleSaveName() {
    if (!newName.trim()) return;
    try {
      await updateGroupName(conversation._id.toString(), newName.trim(), getSocket());
      setEditingName(false);
    } catch (err) { setActionError(err.message); }
  }

  async function handleAddMember(targetId) {
    setAdding(true);
    try {
      await addMembers(conversation._id.toString(), [targetId], getSocket());
    } catch (err) { setActionError(err.message); }
    setAdding(false);
  }

  async function handleRemove(targetId) {
    if (!confirm('Remove this member?')) return;
    try {
      await removeMember(conversation._id.toString(), targetId);
    } catch (err) { setActionError(err.message); }
  }

  async function handleLeave() {
    if (!confirm('Leave this group?')) return;
    try {
      await leaveGroup(conversation._id.toString());
      onLeft?.();
    } catch (err) { setActionError(err.message); }
  }

  async function handleRoleChange(targetId, role) {
    try {
      await updateMemberRole(conversation._id.toString(), targetId, role);
    } catch (err) { setActionError(err.message); }
  }

  return (
    <div className="chat-info-panel">
      <div className="chat-sidebar-header">
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Group Info</span>
        <button className="chat-icon-btn" onClick={onClose}><X size={18} /></button>
      </div>

      <div style={{ textAlign: 'center', padding: '1.5rem 1rem 1rem' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '16px', margin: '0 auto 0.75rem',
          background: 'linear-gradient(135deg, var(--secondary), var(--accent-cyan))',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Users size={28} color="white" />
        </div>
        {editingName ? (
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
            <input
              className="chat-search-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ textAlign: 'center', margin: 0, maxWidth: '180px' }}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
            />
            <button className="chat-icon-btn" onClick={handleSaveName}><Check size={16} style={{ color: 'var(--primary)' }} /></button>
            <button className="chat-icon-btn" onClick={() => setEditingName(false)}><X size={16} /></button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{conversation.name}</span>
            {canManage && (
              <button className="chat-icon-btn" onClick={() => setEditingName(true)} title="Edit name">
                <Edit2 size={14} />
              </button>
            )}
          </div>
        )}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {conversation.members?.length || 0} members
        </div>
      </div>

      {actionError && (
        <div style={{ background: 'var(--accent-red-glow)', border: '1px solid var(--accent-red)', borderRadius: '8px', padding: '0.5rem 0.75rem', margin: '0 1rem 0.75rem', fontSize: '0.8rem', color: 'var(--accent-red)' }}>
          {actionError}
          <button style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setActionError('')}>×</button>
        </div>
      )}

      <div style={{ padding: '0 1rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          Members
        </div>
        {(conversation.members || []).map(member => {
          const isMe = member.userId === userId;
          const canRemoveThis = canManage && !isMe && member.role !== 'owner';
          return (
            <div key={member.userId} style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.5rem 0', borderBottom: '1px solid var(--border)'
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0, position: 'relative',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--bg-darker)', fontWeight: 700, fontSize: '0.75rem'
              }}>
                {(member.name || '?')[0].toUpperCase()}
                <span style={{
                  position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%',
                  background: onlineUsers.has(member.userId) ? 'var(--primary)' : 'var(--text-muted)',
                  border: '2px solid var(--bg-card)'
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{member.name || 'Unknown'}</span>
                  <RoleBadge role={member.role} />
                  {isMe && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(you)</span>}
                </div>
              </div>
              {isOwner && !isMe && member.role !== 'owner' && (
                <select
                  value={member.role}
                  onChange={e => handleRoleChange(member.userId, e.target.value)}
                  style={{
                    background: 'var(--glass-bg)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', borderRadius: '6px', padding: '2px 6px',
                    fontSize: '0.75rem', cursor: 'pointer'
                  }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              )}
              {canRemoveThis && (
                <button className="chat-action-btn danger" title="Remove member" onClick={() => handleRemove(member.userId)}>
                  <UserMinus size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {canManage && (
          <button
            className="chat-icon-btn"
            style={{ width: '100%', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
            onClick={() => setShowAddMembers(v => !v)}
          >
            <UserPlus size={15} /> Add Members
          </button>
        )}

        {showAddMembers && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem' }}>
            <input
              className="chat-search-input"
              style={{ marginBottom: '0.5rem' }}
              placeholder="Search users…"
              value={addQuery}
              onChange={e => setAddQuery(e.target.value)}
            />
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {nonMembers.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>No users to add</div>}
              {nonMembers.map(u => (
                <button key={u.id} onClick={() => handleAddMember(u.id)} disabled={adding}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.25rem', borderRadius: '6px' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    {(u.name || '?')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{u.name || u.email}</span>
                  <UserPlus size={12} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleLeave}
          style={{ width: '100%', background: 'none', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}
        >
          <LogOut size={15} /> Leave Group
        </button>
      </div>
    </div>
  );
}
