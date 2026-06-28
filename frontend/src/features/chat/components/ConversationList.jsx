import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import useChatStore from '../../../shared/store/chatStore.js';
import ConversationItem from './ConversationItem.jsx';
import NewConversationModal from './NewConversationModal.jsx';

export default function ConversationList({ onSelect }) {
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { conversations, activeConversationId, loadingConversations, onlineUsers, userId, openConversation, searchConversations, fetchConversations } = useChatStore();
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim()) searchConversations(query);
      else fetchConversations();
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(conv) {
    openConversation(conv._id.toString());
    onSelect?.();
  }

  function handleConversationCreated(conv) {
    setShowModal(false);
    openConversation(conv._id.toString());
    onSelect?.();
  }

  return (
    <div className="chat-sidebar-inner">
      <div className="chat-sidebar-header">
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Chats</span>
        <button className="chat-icon-btn" onClick={() => setShowModal(true)} title="New conversation">
          <Plus size={20} />
        </button>
      </div>

      <div style={{ position: 'relative', margin: '0 0 0.5rem' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          className="chat-search-input"
          style={{ paddingLeft: '2.2rem' }}
          placeholder="Search conversations…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button
            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
            onClick={() => setQuery('')}
          ><X size={14} /></button>
        )}
      </div>

      <div className="chat-conv-list">
        {loadingConversations && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Loading…
          </div>
        )}
        {!loadingConversations && conversations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>💬</div>
            {query ? 'No conversations found' : 'No conversations yet. Start one!'}
          </div>
        )}
        {conversations.map(conv => (
          <ConversationItem
            key={conv._id.toString()}
            conversation={conv}
            isActive={activeConversationId === conv._id.toString()}
            isOnline={conv.type === 'direct'
              ? onlineUsers.has(conv.members?.find(m => m.userId !== userId)?.userId)
              : false}
            onClick={() => handleSelect(conv)}
          />
        ))}
      </div>

      {showModal && (
        <NewConversationModal
          onClose={() => setShowModal(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </div>
  );
}
