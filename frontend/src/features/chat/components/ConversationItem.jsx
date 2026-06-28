import React from 'react';
import { Users } from 'lucide-react';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 604800000) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function Avatar({ name, isGroup, isOnline }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: 44, height: 44, borderRadius: isGroup ? '12px' : '50%',
        background: isGroup
          ? 'linear-gradient(135deg, var(--secondary), var(--accent-cyan))'
          : 'linear-gradient(135deg, var(--primary), var(--secondary))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--bg-darker)', fontWeight: 700, fontSize: '0.85rem',
        fontFamily: 'var(--font-display)'
      }}>
        {isGroup ? <Users size={18} /> : initials}
      </div>
      {!isGroup && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: isOnline ? 'var(--primary)' : 'var(--text-muted)',
          border: '2px solid var(--bg-card)',
          boxShadow: isOnline ? '0 0 6px var(--primary-glow)' : 'none'
        }} />
      )}
    </div>
  );
}

export default function ConversationItem({ conversation, isActive, isOnline, onClick }) {
  const { type, name, unreadCount } = conversation;
  const lastMessageText = conversation?.lastMessage?.text ?? '';
  const preview = conversation?.lastMessage
    ? (lastMessageText
        ? (lastMessageText.length > 38 ? lastMessageText.substring(0, 38) + '…' : lastMessageText)
        : 'Deleted message')
    : 'No messages yet';

  return (
    <button
      className={`chat-conv-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <Avatar name={name} isGroup={type === 'group'} isOnline={isOnline} />
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
          <span style={{
            fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%'
          }}>{name || 'Unknown'}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
            {formatTime(conversation?.lastMessage?.timestamp)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.8rem', color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
          }}>{preview}</span>
          {unreadCount > 0 && (
            <span style={{
              background: 'var(--primary)', color: 'var(--bg-darker)',
              borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
              padding: '1px 6px', marginLeft: '0.4rem', flexShrink: 0,
              minWidth: '18px', textAlign: 'center'
            }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </div>
      </div>
    </button>
  );
}
