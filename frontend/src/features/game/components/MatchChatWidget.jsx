import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, ChevronDown, Send } from 'lucide-react';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageRow({ message, userId }) {
  const isMine = message.userId === userId;
  return (
    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '0.4rem' }}>
      <div style={{
        maxWidth: '80%',
        padding: '0.45rem 0.7rem',
        borderRadius: isMine ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
        background: isMine
          ? 'linear-gradient(135deg, #00E37A, #00C76B)'
          : 'rgba(255,255,255,0.08)',
        border: isMine ? 'none' : '1px solid rgba(255,255,255,0.12)',
        color: isMine ? '#0A0D12' : '#F5F7FA'
      }}>
        {!isMine && (
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#5B8DEF', marginBottom: '2px' }}>
            {message.userName}
          </div>
        )}
        <div style={{ fontSize: '0.85rem', wordBreak: 'break-word', lineHeight: 1.45 }}>
          {message.text}
        </div>
        <div style={{ fontSize: '0.62rem', opacity: 0.6, textAlign: 'right', marginTop: '2px' }}>
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

function Widget({ messages, sendMessage, isOpen, toggle, unread, userId, opponentName }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, messages.length]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setText('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '76px',
      right: '16px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>
      {isOpen && (
        <div style={{
          width: '290px',
          background: '#141821',
          border: '1px solid #232938',
          borderRadius: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,227,122,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'linear-gradient(135deg, rgba(0,227,122,0.1), rgba(91,141,239,0.1))',
            borderBottom: '1px solid #232938'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F5F7FA', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageCircle size={14} color="#00E37A" />
                Match Chat
              </div>
              {opponentName && (
                <div style={{ fontSize: '0.7rem', color: '#9AA4B2', marginTop: '1px' }}>
                  vs {opponentName}
                </div>
              )}
            </div>
            <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9AA4B2', padding: '4px', borderRadius: '6px', display: 'flex' }}>
              <ChevronDown size={16} />
            </button>
          </div>

          <div style={{ height: '200px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#5B6472', fontSize: '0.8rem', margin: 'auto' }}>
                👋 Say hi to your opponent!
              </div>
            )}
            {messages.map(msg => (
              <MessageRow key={msg.id} message={msg} userId={userId} />
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderTop: '1px solid #232938', background: 'rgba(255,255,255,0.02)' }}>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message your opponent…"
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid #232938',
                borderRadius: '20px', padding: '7px 14px', color: '#F5F7FA',
                fontFamily: 'inherit', fontSize: '0.83rem', outline: 'none'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none', flexShrink: 0,
                background: text.trim() ? 'linear-gradient(135deg, #00E37A, #00C76B)' : '#232938',
                color: text.trim() ? '#0A0D12' : '#5B6472',
                cursor: text.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={toggle}
        title={isOpen ? 'Close chat' : 'Chat with opponent'}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 18px 0 14px', height: '46px',
          borderRadius: '23px', border: 'none', cursor: 'pointer',
          background: isOpen
            ? '#232938'
            : 'linear-gradient(135deg, #00E37A, #5B8DEF)',
          color: isOpen ? '#9AA4B2' : '#0A0D12',
          fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem',
          boxShadow: isOpen ? 'none' : '0 4px 20px rgba(0,227,122,0.45)',
          transition: 'all 0.25s',
          position: 'relative',
          whiteSpace: 'nowrap'
        }}
      >
        <MessageCircle size={18} />
        {!isOpen && 'Chat'}
        {unread > 0 && !isOpen && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#FF4D4F', color: '#fff', borderRadius: '999px',
            fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px',
            minWidth: 18, textAlign: 'center', border: '2px solid #0A0D12'
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}

export default function MatchChatWidget(props) {
  return createPortal(<Widget {...props} />, document.body);
}
