import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import useChatStore from '../../../shared/store/chatStore.js';
import { getSocket } from '../../../shared/services/socketService.js';

export default function MessageInput({ conversationId, replyTo, onClearReply }) {
  const [text, setText] = useState('');
  const { sendMessage } = useChatStore();
  const textareaRef = useRef(null);
  const typingRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId, replyTo]);

  function handleTypingStart() {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      getSocket().emit('chat:typing:start', { conversationId });
    }
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      isTypingRef.current = false;
      getSocket().emit('chat:typing:stop', { conversationId });
    }, 2000);
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    clearTimeout(typingRef.current);
    isTypingRef.current = false;
    getSocket().emit('chat:typing:stop', { conversationId });
    sendMessage(conversationId, trimmed, replyTo?._id?.toString(), getSocket());
    setText('');
    onClearReply?.();
    textareaRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChange(e) {
    setText(e.target.value);
    handleTypingStart();
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; }
  }

  return (
    <div className="chat-input-area">
      {replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--glass-bg)', borderRadius: '8px',
          padding: '0.4rem 0.75rem', marginBottom: '0.5rem',
          borderLeft: '3px solid var(--primary)'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
              Replying to {replyTo.senderName}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyTo.deletedAt ? 'Deleted message' : replyTo.text}
            </div>
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
            onClick={onClearReply}
          ><X size={15} /></button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
        <textarea
          ref={textareaRef}
          className="chat-text-input"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className={`chat-send-btn ${text.trim() ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!text.trim()}
          title="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
