import React, { useEffect, useState } from 'react';
import useAuthStore from '../../shared/store/authStore.js';
import useChatStore from '../../shared/store/chatStore.js';
import { connectSocket, getSocket, disconnectSocket } from '../../shared/services/socketService.js';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import ConversationList from './components/ConversationList.jsx';
import ChatWindow from './components/ChatWindow.jsx';

export default function ChatPage() {
  const { user } = useAuthStore();
  const [mobileView, setMobileView] = useState('list');

  const {
    setUserId, fetchConversations, setActiveConversation, activeConversationId,
    handleNewMessage, handleMessageEdited, handleMessageDeleted,
    handleTyping, handleMessagesRead, handleUserStatus, handleConversationUpdated
  } = useChatStore();

  useEffect(() => {
    if (!user) return;
    setUserId(user.id);
    fetchConversations();

    const socket = connectSocket(user.id);

    socket.on('chat:message:new', handleNewMessage);
    socket.on('chat:message:edited', handleMessageEdited);
    socket.on('chat:message:deleted', handleMessageDeleted);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:messages:read', handleMessagesRead);
    socket.on('chat:user:status', handleUserStatus);
    socket.on('chat:conversation:updated', handleConversationUpdated);

    return () => {
      socket.off('chat:message:new', handleNewMessage);
      socket.off('chat:message:edited', handleMessageEdited);
      socket.off('chat:message:deleted', handleMessageDeleted);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:messages:read', handleMessagesRead);
      socket.off('chat:user:status', handleUserStatus);
      socket.off('chat:conversation:updated', handleConversationUpdated);
    };
  }, [user]);

  function handleConversationSelect() {
    setMobileView('chat');
  }

  function handleBack() {
    setMobileView('list');
    setActiveConversation(null);
  }

  return (
    <AppLayout noPadding>
      <div className="chat-page">
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
