import { useEffect, useState } from 'react';
import useAuthStore from '../../shared/store/authStore.js';
import useChatStore from '../../shared/store/chatStore.js';
import usePlatformStore from '../../shared/store/platformStore.js';
import { connectSocket } from '../../shared/services/socketService.js';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import ConversationList from './components/ConversationList.jsx';
import ChatWindow from './components/ChatWindow.jsx';

export default function ChatPage() {
  const { user } = useAuthStore();
  const [mobileView, setMobileView] = useState('list');
  const { chatEnabled } = usePlatformStore();

  const {
    setUserId, fetchConversations, setActiveConversation, activeConversationId,
    handleNewMessage, handleMessageEdited, handleMessageDeleted,
    handleTyping, handleMessagesRead, handleUserStatus, handleConversationUpdated
  } = useChatStore();

  // All hooks must run unconditionally before any early return
  useEffect(() => {
    if (!user) return;
    setUserId(user.id);
    fetchConversations();

    const socket = connectSocket(user.id);

    const socketHandlers = {
      'chat:message:new': handleNewMessage,
      'chat:message:edited': handleMessageEdited,
      'chat:message:deleted': handleMessageDeleted,
      'chat:typing': handleTyping,
      'chat:messages:read': handleMessagesRead,
      'chat:user:status': handleUserStatus,
      'chat:conversation:updated': handleConversationUpdated,
    };
    Object.entries(socketHandlers).forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      Object.entries(socketHandlers).forEach(([event, handler]) => socket.off(event, handler));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!chatEnabled) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '500px', margin: '3rem auto' }}>
          <span style={{ fontSize: '3rem' }}>💬</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginTop: '1rem', color: 'var(--text-primary)' }}>Chat Disabled</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            The chat feature is currently disabled by the administrator.
          </p>
        </div>
      </AppLayout>
    );
  }

  function handleConversationSelect() {
    setMobileView('chat');
  }

  function handleBack() {
    setMobileView('list');
    setActiveConversation(null);
  }

  return (
    <AppLayout noPadding hideBottomNav={mobileView === 'chat'}>
      <div className={`chat-page ${mobileView === 'chat' ? 'hide-bottom-nav' : ''}`}>
        <div className={`chat-sidebar ${mobileView === 'chat' ? 'chat-sidebar--hidden' : ''}`}>
          <ConversationList onSelect={handleConversationSelect} />
        </div>
        <div className={`chat-main ${mobileView === 'list' && !activeConversationId ? 'chat-main--empty' : ''} ${mobileView === 'list' ? 'chat-main--hidden' : ''}`}>
          {activeConversationId ? (
            <ChatWindow userId={user?.id} onBack={handleBack} />
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '4rem' }}>💬</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                Select a conversation to start chatting
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                Or create a new one using the + button
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
