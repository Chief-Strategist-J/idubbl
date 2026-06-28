import { getDb } from '../db.js';
import * as ChatService from './ChatService.js';
import * as MatchChatService from './MatchChatService.js';

const socketUsers = new Map();
const userSockets = new Map();

function trackConnect(socketId, userId) {
  socketUsers.set(socketId, userId);
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socketId);
}

function trackDisconnect(socketId) {
  const userId = socketUsers.get(socketId);
  socketUsers.delete(socketId);
  if (!userId) return null;
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) userSockets.delete(userId);
  }
  return userId;
}

export function isOnline(userId) {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
}

async function getConversationIds(userId) {
  const db = await getDb();
  const convs = await db.collection('conversations')
    .find({ 'members.userId': userId }, { projection: { _id: 1 } })
    .toArray();
  return convs.map(c => c._id.toString());
}

async function getSenderName(userId) {
  const db = await getDb();
  const user = await db.collection('user').findOne({ id: userId }, { projection: { name: 1, email: 1 } });
  return user?.name || user?.email || 'Unknown';
}

function broadcastStatus(io, convIds, userId, online) {
  const payload = { userId, online, lastSeen: online ? null : new Date() };
  convIds.forEach(id => io.to(`conv:${id}`).emit('chat:user:status', payload));
}

function makeChatHandlers(io, socket) {
  return {
    'chat:join': async (userId) => {
      const uid = String(userId || '').trim();
      if (!uid) return;
      trackConnect(socket?.id, uid);
      socket.join(`user:${uid}`);
      const convIds = await getConversationIds(uid);
      convIds.forEach(id => socket.join(`conv:${id}`));
      broadcastStatus(io, convIds, uid, true);
    },

    'chat:message:send': async ({ conversationId, text, replyTo } = {}) => {
      const userId = socketUsers.get(socket?.id);
      const convId = String(conversationId || '').trim();
      if (!userId || !convId || !text?.trim()) return;
      try {
        const senderName = await getSenderName(userId);
        const message = await ChatService.sendMessage(convId, userId, senderName, text, replyTo);
        io.to(`conv:${convId}`).emit('chat:message:new', { conversationId: convId, message });
      } catch (err) {
        socket.emit('chat:error', { event: 'send', error: err.message });
      }
    },

    'chat:message:edit': async ({ conversationId, messageId, text } = {}) => {
      const userId = socketUsers.get(socket?.id);
      const convId = String(conversationId || '').trim();
      const msgId = String(messageId || '').trim();
      if (!userId || !convId || !msgId || !text?.trim()) return;
      try {
        const message = await ChatService.editMessage(convId, msgId, userId, text);
        io.to(`conv:${convId}`).emit('chat:message:edited', { conversationId: convId, message });
      } catch (err) {
        socket.emit('chat:error', { event: 'edit', error: err.message });
      }
    },

    'chat:message:delete': async ({ conversationId, messageId } = {}) => {
      const userId = socketUsers.get(socket?.id);
      const convId = String(conversationId || '').trim();
      const msgId = String(messageId || '').trim();
      if (!userId || !convId || !msgId) return;
      try {
        await ChatService.deleteMessage(convId, msgId, userId);
        io.to(`conv:${convId}`).emit('chat:message:deleted', { conversationId: convId, messageId: msgId });
      } catch (err) {
        socket.emit('chat:error', { event: 'delete', error: err.message });
      }
    },

    'chat:typing:start': ({ conversationId } = {}) => {
      const userId = socketUsers.get(socket?.id);
      const convId = String(conversationId || '').trim();
      if (!userId || !convId) return;
      socket.to(`conv:${convId}`).emit('chat:typing', { conversationId: convId, userId, typing: true });
    },

    'chat:typing:stop': ({ conversationId } = {}) => {
      const userId = socketUsers.get(socket?.id);
      const convId = String(conversationId || '').trim();
      if (!userId || !convId) return;
      socket.to(`conv:${convId}`).emit('chat:typing', { conversationId: convId, userId, typing: false });
    },

    'chat:messages:read': async ({ conversationId } = {}) => {
      const userId = socketUsers.get(socket?.id);
      const convId = String(conversationId || '').trim();
      if (!userId || !convId) return;
      try {
        const readAt = await ChatService.markRead(convId, userId);
        io.to(`conv:${convId}`).emit('chat:messages:read', { conversationId: convId, userId, readAt });
      } catch {
        // silent
      }
    },

    'chat:join:conversation': ({ conversationId } = {}) => {
      const convId = String(conversationId || '').trim();
      if (convId) socket.join(`conv:${convId}`);
    },

    'match:chat:join': ({ matchId } = {}) => {
      const mid = String(matchId || '').trim();
      if (!mid) return;
      socket.join(`match:${mid}`);
      const history = MatchChatService.getMatchMessages(mid);
      socket.emit('match:chat:history', { matchId: mid, messages: history });
    },

    'match:chat:send': ({ matchId, text, userName } = {}) => {
      const userId = socketUsers.get(socket?.id);
      const mid = String(matchId || '').trim();
      if (!userId || !mid || !text?.trim()) return;
      try {
        const message = MatchChatService.sendMatchMessage(mid, userId, userName, text);
        io.to(`match:${mid}`).emit('match:chat:message', message);
      } catch {
        // silent — validation failures are non-critical in-game
      }
    },

    'match:chat:leave': ({ matchId } = {}) => {
      const mid = String(matchId || '').trim();
      if (!mid) return;
      socket.leave(`match:${mid}`);
    },

    'disconnect': async () => {
      console.log(`Client disconnected: ${socket?.id}`);
      const userId = trackDisconnect(socket?.id);
      if (!userId || isOnline(userId)) return;
      const convIds = await getConversationIds(userId);
      broadcastStatus(io, convIds, userId, false);
    },
  };
}

export function initChatSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket?.id}`);
    const handlers = makeChatHandlers(io, socket);
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });
  });
}
