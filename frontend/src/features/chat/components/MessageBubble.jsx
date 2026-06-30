import React, { useState, useEffect } from 'react';
import { CornerUpLeft, Edit2, Trash2, Check, CheckCheck } from 'lucide-react';
import useChatStore from '../../../shared/store/chatStore.js';
import { getSocket } from '../../../shared/services/socketService.js';

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isMine, isGroup, conversationId, onReply }) {
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message?.text ?? '');
  const { editMessage, deleteMessage } = useChatStore();
  const isDeleted = !!message.deletedAt;

  useEffect(() => {
    if (editing) setEditText(message?.text ?? '');
  }, [editing]);

  function handleEdit() {
    setEditing(false);
    editMessage(conversationId, message?._id?.toString(), editText, getSocket());
  }

  function handleDelete() {
    if (confirm('Delete this message?')) {
      deleteMessage(conversationId, message?._id?.toString(), getSocket());
    }
  }

  return (
    <div
      className={`chat-msg-row ${isMine ? 'mine' : 'theirs'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); }}
    >
      {!isMine && (
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0, alignSelf: 'flex-end',
          background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--bg-darker)', fontWeight: 700, fontSize: '0.7rem'
        }}>
          {(message.senderName || '?')[0].toUpperCase()}
        </div>
      )}

      <div className={`chat-msg-bubble ${isMine ? 'mine' : 'theirs'}`}>
        {isGroup && !isMine && (
          <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '0.2rem' }}>
            {message.senderName}
          </div>
        )}

        {message.replyTo && (
          <div style={{
            background: 'rgba(255,255,255,0.07)', borderLeft: '3px solid var(--primary)',
            borderRadius: '4px', padding: '0.3rem 0.5rem', marginBottom: '0.4rem',
            fontSize: '0.75rem', color: 'var(--text-secondary)'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.1rem' }}>
              {message.replyTo.senderName}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              {message.replyTo.text}
            </div>
          </div>
        )}

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="chat-edit-input"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); } if (e.key === 'Escape') setEditing(false); }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }} onClick={() => setEditing(false)}>Cancel</button>
              <button style={{ background: 'var(--primary)', color: 'var(--bg-darker)', border: 'none', borderRadius: '6px', padding: '2px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }} onClick={handleEdit}>Save</button>
            </div>
          </div>
        ) : (
          <>
            {isDeleted ? (
              <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                This message was deleted
              </span>
            ) : (
              <span style={{ fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: 1.45 }}>
                {message?.text ?? ''}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.6rem', color: isMine ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)' }}>
                {formatTime(message.createdAt)}
                {message.editedAt && !isDeleted && <span style={{ marginLeft: '0.3rem' }}>· edited</span>}
              </span>
              {isMine && !isDeleted && (
                <CheckCheck size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
              )}
            </div>
          </>
        )}
      </div>

      {!isDeleted && showActions && !editing && (
        <div className={`chat-msg-actions ${isMine ? 'mine' : 'theirs'}`}>
          <button className="chat-action-btn" title="Reply" onClick={() => onReply(message)}>
            <CornerUpLeft size={13} />
          </button>
          {isMine && (
            <>
              <button className="chat-action-btn" title="Edit" onClick={() => setEditing(true)}>
                <Edit2 size={13} />
              </button>
              <button className="chat-action-btn danger" title="Delete" onClick={handleDelete}>
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
