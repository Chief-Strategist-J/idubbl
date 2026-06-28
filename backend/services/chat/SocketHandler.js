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
  for (const id of convIds) io.to(`conv:${id}`).emit('chat:user:status', payload);
}

export function initChatSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('chat:join', async (userId) => {
      if (!userId) return;
      trackConnect(socket.id, userId);
      socket.join(`user:${userId}`);
      const convIds = await getConversationIds(userId);
      for (const id of convIds) socket.join(`conv:${id}`);
      broadcastStatus(io, convIds, userId, true);
    });

    socket.on('chat:message:send', async ({ conversationId, text, replyTo }) => {
      const userId = socketUsers.get(socket.id);
      if (!userId || !conversationId || !text?.trim()) return;
      try {
        const senderName = await getSenderName(userId);
        const message = await ChatService.sendMessage(conversationId, userId, senderName, text, replyTo);
        io.to(`conv:${conversationId}`).emit('chat:message:new', { conversationId, message });
      } catch (err) {
        socket.emit('chat:error', { event: 'send', error: err.message });
      }
    });

    socket.on('chat:message:edit', async ({ conversationId, messageId, text }) => {
      const userId = socketUsers.get(socket.id);
      if (!userId || !conversationId || !messageId || !text?.trim()) return;
      try {
        const message = await ChatService.editMessage(conversationId, messageId, userId, text);
        io.to(`conv:${conversationId}`).emit('chat:message:edited', { conversationId, message });
      } catch (err) {
        socket.emit('chat:error', { event: 'edit', error: err.message });
      }
    });

    socket.on('chat:message:delete', async ({ conversationId, messageId }) => {
      const userId = socketUsers.get(socket.id);
      if (!userId || !conversationId || !messageId) return;
      try {
        await ChatService.deleteMessage(conversationId, messageId, userId);
        io.to(`conv:${conversationId}`).emit('chat:message:deleted', { conversationId, messageId });
      } catch (err) {
        socket.emit('chat:error', { event: 'delete', error: err.message });
      }
    });

    socket.on('chat:typing:start', ({ conversationId }) => {
      const userId = socketUsers.get(socket.id);
      if (!userId || !conversationId) return;
      socket.to(`conv:${conversationId}`).emit('chat:typing', { conversationId, userId, typing: true });
    });

    socket.on('chat:typing:stop', ({ conversationId }) => {
      const userId = socketUsers.get(socket.id);
      if (!userId || !conversationId) return;
      socket.to(`conv:${conversationId}`).emit('chat:typing', { conversationId, userId, typing: false });
    });

    socket.on('chat:messages:read', async ({ conversationId }) => {
      const userId = socketUsers.get(socket.id);
      if (!userId || !conversationId) return;
      try {
        const readAt = await ChatService.markRead(conversationId, userId);
        io.to(`conv:${conversationId}`).emit('chat:messages:read', { conversationId, userId, readAt });
      } catch {
        // silent
      }
    });

    socket.on('chat:join:conversation', ({ conversationId }) => {
      if (conversationId) socket.join(`conv:${conversationId}`);
    });

    socket.on('match:chat:join', ({ matchId }) => {
      if (!matchId) return;
      socket.join(`match:${matchId}`);
      const history = MatchChatService.getMatchMessages(matchId);
      socket.emit('match:chat:history', { matchId, messages: history });
    });

    socket.on('match:chat:send', ({ matchId, text, userName }) => {
      const userId = socketUsers.get(socket.id);
      if (!userId || !matchId || !text?.trim()) return;
      try {
        const message = MatchChatService.sendMatchMessage(matchId, userId, userName, text);
        io.to(`match:${matchId}`).emit('match:chat:message', message);
      } catch {
        // silent — validation failures are non-critical in-game
      }
    });

    socket.on('match:chat:leave', ({ matchId }) => {
      if (!matchId) return;
      socket.leave(`match:${matchId}`);
    });

    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);
      const userId = trackDisconnect(socket.id);
      if (!userId || isOnline(userId)) return;
      const convIds = await getConversationIds(userId);
      broadcastStatus(io, convIds, userId, false);
    });
  });
}
