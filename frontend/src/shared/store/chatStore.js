import { create } from 'zustand';

let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
  apiBase = `https://${apiBase}`;
}
const API = `${apiBase}/api/chat`;

function headers(userId) {
  return { 'Content-Type': 'application/json', 'x-user-id': userId };
}

async function apiFetch(url, userId, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { ...headers(userId), ...options.headers }
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data.data;
}

function applyNewMessage(conv, message, isActive, userId) {
  return {
    ...conv,
    lastMessage: {
      messageId: message._id,
      text: message.text,
      senderId: message.senderId,
      senderName: message.senderName,
      timestamp: message.createdAt
    },
    unreadCount: isActive || message.senderId === userId ? conv.unreadCount : (conv.unreadCount || 0) + 1,
    updatedAt: message.createdAt
  };
}

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  hasMore: {},
  onlineUsers: new Set(),
  typing: {},
  users: [],
  loadingConversations: false,
  loadingMessages: {},
  userId: null,

  setUserId: (id) => set({ userId: id }),

  fetchConversations: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ loadingConversations: true });
    try {
      const data = await apiFetch(`${API}/conversations`, userId);
      set({ conversations: data, loadingConversations: false });
    } catch {
      set({ loadingConversations: false });
    }
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  openConversation: async (conversationId) => {
    const { userId, messages } = get();
    set({ activeConversationId: conversationId });
    if (!messages[conversationId]) {
      await get().fetchMessages(conversationId);
    }
    get().markRead(conversationId);
  },

  fetchMessages: async (conversationId, before) => {
    const { userId } = get();
    if (!userId) return;
    set(s => ({ loadingMessages: { ...s.loadingMessages, [conversationId]: true } }));
    try {
      const url = new URL(`${API}/conversations/${conversationId}/messages`);
      if (before) url.searchParams.set('before', before);
      url.searchParams.set('limit', '50');
      const data = await apiFetch(url.toString(), userId);
      set(s => {
        const existing = s.messages[conversationId] || [];
        const merged = before ? [...data.messages, ...existing] : data.messages;
        return {
          messages: { ...s.messages, [conversationId]: merged },
          hasMore: { ...s.hasMore, [conversationId]: data.hasMore },
          loadingMessages: { ...s.loadingMessages, [conversationId]: false }
        };
      });
    } catch {
      set(s => ({ loadingMessages: { ...s.loadingMessages, [conversationId]: false } }));
    }
  },

  loadMoreMessages: async (conversationId) => {
    const msgs = get().messages[conversationId];
    if (!msgs || msgs.length === 0) return;
    await get().fetchMessages(conversationId, msgs[0].createdAt);
  },

  sendMessage: (conversationId, text, replyTo, socket) => {
    if (!text?.trim()) return;
    socket.emit('chat:message:send', { conversationId, text: text.trim(), replyTo: replyTo || undefined });
  },

  editMessage: (conversationId, messageId, text, socket) => {
    if (!text?.trim()) return;
    socket.emit('chat:message:edit', { conversationId, messageId, text: text.trim() });
  },

  deleteMessage: (conversationId, messageId, socket) => {
    socket.emit('chat:message:delete', { conversationId, messageId });
  },

  markRead: async (conversationId) => {
    const { userId } = get();
    if (!userId) return;
    try {
      await apiFetch(`${API}/conversations/${conversationId}/read`, userId, { method: 'POST' });
      set(s => ({
        conversations: (s.conversations ?? []).map(c =>
          c._id?.toString() === conversationId ? { ...c, unreadCount: 0 } : c
        )
      }));
    } catch {
      // silent
    }
  },

  createDirect: async (targetUserId) => {
    const { userId } = get();
    const conv = await apiFetch(`${API}/conversations/direct`, userId, {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    });
    set(s => {
      const exists = (s.conversations ?? []).some(c => c._id?.toString() === conv._id?.toString());
      return exists
        ? { conversations: s.conversations }
        : { conversations: [conv, ...(s.conversations ?? [])] };
    });
    return conv;
  },

  createGroup: async (name, memberIds) => {
    const { userId } = get();
    const conv = await apiFetch(`${API}/conversations/group`, userId, {
      method: 'POST',
      body: JSON.stringify({ name, memberIds })
    });
    set(s => ({ conversations: [conv, ...(s.conversations ?? [])] }));
    return conv;
  },

  updateGroupName: async (conversationId, name, socket) => {
    const { userId } = get();
    const data = await apiFetch(`${API}/conversations/${conversationId}/name`, userId, {
      method: 'PATCH',
      body: JSON.stringify({ name })
    });
    set(s => ({
      conversations: (s.conversations ?? []).map(c =>
        c._id?.toString() === conversationId ? { ...c, name: data.name } : c
      )
    }));
    if (socket) socket.emit('chat:conversation:updated', { conversationId, name: data.name });
    return data.name;
  },

  addMembers: async (conversationId, memberIds, socket) => {
    const { userId } = get();
    if (!memberIds?.length) return;
    await apiFetch(`${API}/conversations/${conversationId}/members`, userId, {
      method: 'POST',
      body: JSON.stringify({ memberIds })
    });
    if (socket) {
      memberIds.forEach(() => socket.emit('chat:join:conversation', { conversationId }));
    }
    await get().fetchConversationDetails(conversationId);
  },

  removeMember: async (conversationId, targetId) => {
    const { userId } = get();
    await apiFetch(`${API}/conversations/${conversationId}/members/${targetId}`, userId, { method: 'DELETE' });
    await get().fetchConversationDetails(conversationId);
  },

  leaveGroup: async (conversationId) => {
    const { userId } = get();
    await apiFetch(`${API}/conversations/${conversationId}/leave`, userId, { method: 'POST' });
    set(s => ({
      conversations: (s.conversations ?? []).filter(c => c._id?.toString() !== conversationId),
      activeConversationId: s.activeConversationId === conversationId ? null : s.activeConversationId,
      messages: Object.fromEntries(Object.entries(s.messages).filter(([k]) => k !== conversationId))
    }));
  },

  updateMemberRole: async (conversationId, targetId, role) => {
    const { userId } = get();
    await apiFetch(`${API}/conversations/${conversationId}/members/${targetId}/role`, userId, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
    await get().fetchConversationDetails(conversationId);
  },

  fetchConversationDetails: async (conversationId) => {
    const { userId } = get();
    try {
      const conv = await apiFetch(`${API}/conversations/${conversationId}`, userId);
      set(s => ({
        conversations: (s.conversations ?? []).map(c =>
          c._id?.toString() === conversationId ? { ...c, ...conv } : c
        )
      }));
      return conv;
    } catch {
      return null;
    }
  },

  fetchUsers: async (query) => {
    const { userId } = get();
    try {
      const url = new URL(`${API}/users`);
      if (query?.trim()) url.searchParams.set('q', query.trim());
      const data = await apiFetch(url.toString(), userId);
      set({ users: data });
    } catch {
      set({ users: [] });
    }
  },

  searchConversations: async (query) => {
    const { userId } = get();
    if (!query?.trim()) {
      await get().fetchConversations();
      return;
    }
    try {
      const url = new URL(`${API}/search/conversations`);
      url.searchParams.set('q', query.trim());
      const data = await apiFetch(url.toString(), userId);
      set({ conversations: data });
    } catch {
      // silent
    }
  },

  handleNewMessage: (data) => {
    const { conversationId, message } = data;
    if (!conversationId || !message) return;
    const { userId } = get();
    set(s => {
      const updatedConvs = (s.conversations ?? []).map(c =>
        c._id?.toString() === conversationId
          ? applyNewMessage(c, message, s.activeConversationId === conversationId, userId)
          : c
      );
      return {
        messages: {
          ...s.messages,
          [conversationId]: [...(s.messages[conversationId] ?? []), message]
        },
        conversations: [...updatedConvs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      };
    });
  },

  handleMessageEdited: (data) => {
    const { conversationId, message } = data;
    set(s => {
      const msgs = s.messages[conversationId];
      if (!msgs) return {};
      return {
        messages: {
          ...s.messages,
          [conversationId]: msgs.map(m =>
            m._id?.toString() === message._id?.toString() ? { ...m, text: message.text, editedAt: message.editedAt } : m
          )
        }
      };
    });
  },

  handleMessageDeleted: (data) => {
    const { conversationId, messageId } = data;
    set(s => {
      const msgs = s.messages[conversationId];
      if (!msgs) return {};
      return {
        messages: {
          ...s.messages,
          [conversationId]: msgs.map(m =>
            m._id?.toString() === messageId ? { ...m, deletedAt: new Date(), text: '' } : m
          )
        }
      };
    });
  },

  handleTyping: (data) => {
    const { conversationId, userId: typerId, typing } = data;
    set(s => {
      const current = s.typing[conversationId] || {};
      return {
        typing: {
          ...s.typing,
          [conversationId]: typing
            ? { ...current, [typerId]: true }
            : Object.fromEntries(Object.entries(current).filter(([k]) => k !== typerId))
        }
      };
    });
  },

  handleMessagesRead: (data) => {
    const { conversationId, userId: readerId } = data;
    const { userId } = get();
    if (readerId === userId) return;
    set(s => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] ?? []).map(m =>
          m.senderId === userId ? { ...m, readBy: [...(m.readBy || []), readerId] } : m
        )
      }
    }));
  },

  handleUserStatus: (data) => {
    const { userId: uid, online } = data;
    set(s => {
      const next = new Set(s.onlineUsers);
      if (online) next.add(uid); else next.delete(uid);
      return { onlineUsers: next };
    });
  },

  handleConversationUpdated: (data) => {
    const { conversationId, name } = data;
    if (!name) return;
    set(s => ({
      conversations: (s.conversations ?? []).map(c =>
        c._id?.toString() === conversationId ? { ...c, name } : c
      )
    }));
  }
}));

export default useChatStore;
