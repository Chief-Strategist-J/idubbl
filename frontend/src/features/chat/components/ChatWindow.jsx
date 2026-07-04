import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Users, Info } from 'lucide-react';
import useChatStore from '../../../shared/store/chatStore.js';
import MessageBubble from './MessageBubble.jsx';
import MessageInput from './MessageInput.jsx';
import GroupInfoPanel from './GroupInfoPanel.jsx';

export default function ChatWindow({ userId, onBack }) {
  const [replyTo, setReplyTo] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeight = useRef(0);

  const {
    activeConversationId, conversations, messages, hasMore,
    loadingMessages, typing, onlineUsers,
    loadMoreMessages, markRead, setActiveConversation
  } = useChatStore();

  const conversationId = activeConversationId;
  const conversation = conversations.find(c => c?._id?.toString() === conversationId);
  const msgs = messages[conversationId] ?? [];
  const isLoading = loadingMessages[conversationId];
  const typingUsers = typing[conversationId] || {};
  const typingNames = Object.keys(typingUsers).filter(uid => uid !== userId);

  const isGroup = conversation?.type === 'group';
  const otherMember = !isGroup ? conversation?.members?.find(m => m.userId !== userId) : null;
  const isOnline = otherMember ? onlineUsers.has(otherMember.userId) : false;

  useEffect(() => {
    if (atBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [msgs.length]);

  useEffect(() => {
    if (conversationId) {
      markRead(conversationId);
      setAtBottom(true);
    }
    setReplyTo(null);
    setShowInfo(false);
  }, [conversationId]);

  function handleScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAtBottom(isNearBottom);
    if (el.scrollTop < 80 && hasMore[conversationId] && !isLoading) {
      prevScrollHeight.current = el.scrollHeight;
      loadMoreMessages(conversationId).then(() => {
        requestAnimationFrame(() => {
          if (el) el.scrollTop = el.scrollHeight - prevScrollHeight.current;
        });
      });
    }
  }

  if (!conversation) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '3rem' }}>💬</div>
        <div>Select a conversation to start chatting</div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <button className="chat-icon-btn chat-back-btn" onClick={onBack} title="Back">
          <ArrowLeft size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: isGroup ? '10px' : '50%',
              background: isGroup
                ? 'linear-gradient(135deg, var(--secondary), var(--accent-cyan))'
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--bg-darker)', fontWeight: 700, fontSize: '0.9rem'
            }}>
              {isGroup ? <Users size={18} /> : (conversation.name || '?')[0].toUpperCase()}
            </div>
            {!isGroup && (
              <span style={{
                position: 'absolute', bottom: 1, right: 1, width: 10, height: 10,
                borderRadius: '50%', background: isOnline ? 'var(--primary)' : 'var(--text-muted)',
                border: '2px solid var(--bg-card)', boxShadow: isOnline ? '0 0 5px var(--primary-glow)' : 'none'
              }} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conversation.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isGroup
                ? `${conversation?.members?.length ?? 0} members`
                : isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {isGroup && (
          <button className="chat-icon-btn" onClick={() => setShowInfo(v => !v)} title="Group info">
            <Info size={18} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div
            ref={messagesContainerRef}
            className="chat-messages"
            onScroll={handleScroll}
          >
            {isLoading && (
              <div style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Loading messages…
              </div>
            )}
            {!isLoading && hasMore[conversationId] && (
              <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Scroll up for more
              </div>
            )}
            {msgs.length === 0 && !isLoading && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No messages yet. Say hello!
              </div>
            )}
            {msgs.map((msg, i) => {
              const isMine = (msg?.senderId ?? '') === userId;
              const prevMsg = msgs[i - 1];
              const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
              return (
                <React.Fragment key={msg._id?.toString() || i}>
                  {showDate && (
                    <div style={{ textAlign: 'center', margin: '1rem 0 0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span style={{ background: 'var(--glass-bg)', padding: '3px 10px', borderRadius: '999px', border: '1px solid var(--border)' }}>
                        {new Date(msg.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isMine={isMine}
                    isGroup={isGroup}
                    conversationId={conversationId}
                    onReply={setReplyTo}
                  />
                </React.Fragment>
              );
            })}
            {typingNames.length > 0 && (
              <div style={{ padding: '0.25rem 1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {conversation?.members?.find(m => m.userId === typingNames[0])?.name ?? 'Someone'} is typing…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <MessageInput
            conversationId={conversationId}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
          />
        </div>

        {showInfo && isGroup && (
          <GroupInfoPanel
            conversation={conversation}
            userId={userId}
            onClose={() => setShowInfo(false)}
            onLeft={() => { setShowInfo(false); setActiveConversation(null); }}
          />
        )}
      </div>
    </div>
  );
}
