import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';
import { ConversationModel } from '../../models/Conversation.js';
import { MessageModel } from '../../models/Message.js';

const MESSAGES_PAGE_SIZE = 50;

function toObjId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

function isMember(conv, userId) {
  return conv.members.some(m => m.userId === userId);
}

function getMemberRole(conv, userId) {
  return conv.members.find(m => m.userId === userId)?.role;
}

function canManage(conv, userId) {
  const role = getMemberRole(conv, userId);
  return role === 'owner' || role === 'admin';
}

async function fetchUserNames(db, userIds) {
  if (!userIds.length) return new Map();
  const users = await db.collection('user')
    .find({ id: { $in: userIds } }, { projection: { id: 1, name: 1, email: 1 } })
    .toArray();
  return new Map(users.map(u => [u.id, u.name || u.email || 'Unknown']));
}

async function getUnreadCount(db, conversationId, userId, lastReadAt) {
  return db.collection('messages').countDocuments({
    conversationId,
    senderId: { $ne: userId },
    createdAt: { $gt: lastReadAt },
    deletedAt: null
  });
}

function buildConversationView(conv, userId, nameMap, unreadCount) {
  const otherId = conv.members.find(m => m.userId !== userId)?.userId;
  const displayName = conv.type === 'direct'
    ? (nameMap.get(otherId) || 'Unknown')
    : conv.name;
  return {
    _id: conv._id,
    type: conv.type,
    name: displayName,
    members: conv.members.map(m => ({ userId: m.userId, role: m.role, name: nameMap.get(m.userId) || 'Unknown' })),
    lastMessage: conv.lastMessage,
    unreadCount,
    updatedAt: conv.updatedAt,
    createdAt: conv.createdAt
  };
}

export async function initIndexes() {
  const db = await getDb();
  await db.collection('conversations').createIndex({ 'members.userId': 1 });
  await db.collection('conversations').createIndex({ updatedAt: -1 });
  await db.collection('messages').createIndex({ conversationId: 1, createdAt: 1 });
}

export async function getConversations(userId) {
  const db = await getDb();
  const conversations = await db.collection('conversations')
    .find({ 'members.userId': userId })
    .sort({ updatedAt: -1 })
    .toArray();
  const allUserIds = [...new Set(conversations.flatMap(c => c.members.map(m => m.userId)))];
  const nameMap = await fetchUserNames(db, allUserIds);
  return Promise.all(conversations.map(async conv => {
    const member = conv.members.find(m => m.userId === userId);
    const unreadCount = await getUnreadCount(db, conv._id, userId, member.lastReadAt);
    return buildConversationView(conv, userId, nameMap, unreadCount);
  }));
}

export async function getOrCreateDirect(userId, targetUserId) {
  if (!targetUserId || userId === targetUserId) throw new Error('Invalid target user.');
  const db = await getDb();
  const existing = await db.collection('conversations').findOne({
    type: 'direct',
    'members.userId': { $all: [userId, targetUserId] }
  });
  const nameMap = await fetchUserNames(db, [userId, targetUserId]);
  if (existing) {
    const member = existing.members.find(m => m.userId === userId);
    const unreadCount = await getUnreadCount(db, existing._id, userId, member.lastReadAt);
    return buildConversationView(existing, userId, nameMap, unreadCount);
  }
  const doc = ConversationModel.validate({ type: 'direct', name: null, members: [userId, targetUserId], createdBy: userId });
  const { insertedId } = await db.collection('conversations').insertOne(doc);
  return buildConversationView({ _id: insertedId, ...doc }, userId, nameMap, 0);
}

export async function createGroup(userId, name, memberIds) {
  const allMembers = [...new Set([userId, ...memberIds])];
  if (allMembers.length < 2) throw new Error('Group needs at least 2 members.');
  const doc = ConversationModel.validate({ type: 'group', name, members: allMembers, createdBy: userId });
  const db = await getDb();
  const { insertedId } = await db.collection('conversations').insertOne(doc);
  const nameMap = await fetchUserNames(db, allMembers);
  return buildConversationView({ _id: insertedId, ...doc }, userId, nameMap, 0);
}

export async function getConversation(conversationId, userId) {
  const id = toObjId(conversationId);
  if (!id) throw new Error('Invalid conversation ID.');
  const db = await getDb();
  const conv = await db.collection('conversations').findOne({ _id: id });
  if (!conv) throw new Error('Conversation not found.');
  if (!isMember(conv, userId)) throw new Error('Access denied.');
  const nameMap = await fetchUserNames(db, conv.members.map(m => m.userId));
  const member = conv.members.find(m => m.userId === userId);
  const unreadCount = await getUnreadCount(db, conv._id, userId, member.lastReadAt);
  return buildConversationView(conv, userId, nameMap, unreadCount);
}

export async function deleteConversation(conversationId, userId) {
  const id = toObjId(conversationId);
  if (!id) throw new Error('Invalid conversation ID.');
  const db = await getDb();
  const conv = await db.collection('conversations').findOne({ _id: id });
  if (!conv) throw new Error('Conversation not found.');
  if (!isMember(conv, userId)) throw new Error('Access denied.');
  if (conv.type === 'group' && getMemberRole(conv, userId) !== 'owner') {
    throw new Error('Only the owner can delete a group.');
  }
  await db.collection('conversations').deleteOne({ _id: id });
  await db.collection('messages').deleteMany({ conversationId: id });
}

export async function updateGroupName(conversationId, userId, name) {
  const trimmed = name?.trim();
  if (!trimmed) throw new Error('Name is required.');
  const id = toObjId(conversationId);
  if (!id) throw new Error('Invalid conversation ID.');
  const db = await getDb();
  const conv = await db.collection('conversations').findOne({ _id: id });
  if (!conv) throw new Error('Conversation not found.');
  if (conv.type !== 'group') throw new Error('Only groups have names.');
  if (!isMember(conv, userId)) throw new Error('Access denied.');
  if (!canManage(conv, userId)) throw new Error('Only admins and owners can rename groups.');
  await db.collection('conversations').updateOne({ _id: id }, { $set: { name: trimmed, updatedAt: new Date() } });
  return trimmed;
}

export async function addMembers(conversationId, userId, memberIds) {
  const id = toObjId(conversationId);
  if (!id) throw new Error('Invalid conversation ID.');
  if (!Array.isArray(memberIds) || memberIds.length === 0) throw new Error('Member IDs required.');
  const db = await getDb();
  const conv = await db.collection('conversations').findOne({ _id: id });
  if (!conv) throw new Error('Conversation not found.');
  if (conv.type !== 'group') throw new Error('Cannot add members to a direct conversation.');
  if (!isMember(conv, userId)) throw new Error('Access denied.');
  if (!canManage(conv, userId)) throw new Error('Only admins and owners can add members.');
  const existingIds = new Set(conv.members.map(m => m.userId));
  const newIds = [...new Set(memberIds)].filter(uid => !existingIds.has(uid));
  if (newIds.length === 0) return [];
  const now = new Date();
  const newMembers = newIds.map(uid => ({ userId: uid, role: 'member', joinedAt: now, lastReadAt: new Date(0) }));
  await db.collection('conversations').updateOne(
    { _id: id },
    { $push: { members: { $each: newMembers } }, $set: { updatedAt: now } }
  );
  const nameMap = await fetchUserNames(db, newIds);
  return newMembers.map(m => ({ ...m, name: nameMap.get(m.userId) || 'Unknown' }));
}

export async function removeMember(conversationId, userId, targetUserId) {
  const id = toObjId(conversationId);
  if (!id) throw new Error('Invalid conversation ID.');
  const db = await getDb();
  const conv = await db.collection('conversations').findOne({ _id: id });
  if (!conv) throw new Error('Conversation not found.');
  if (conv.type !== 'group') throw new Error('Cannot remove members from a direct conversation.');
  if (!isMember(conv, userId)) throw new Error('Access denied.');
  if (!canManage(conv, userId)) throw new Error('Only admins and owners can remove members.');
  const targetRole = getMemberRole(conv, targetUserId);
  if (!targetRole) throw new Error('User is not in this conversation.');
  if (targetRole === 'owner') throw new Error('Cannot remove the group owner.');
  await db.collection('conversations').updateOne(
    { _id: id },
    { $pull: { members: { userId: targetUserId } }, $set: { updatedAt: new Date() } }
  );
}

export async function leaveGroup(conversationId, userId) {
  const id = toObjId(conversationId);
  if (!id) throw new Error('Invalid conversation ID.');
  const db = await getDb();
  const conv = await db.collection('conversations').findOne({ _id: id });
  if (!conv) throw new Error('Conversation not found.');
  if (conv.type !== 'group') throw new Error('Cannot leave a direct conversation.');
  if (!isMember(conv, userId)) throw new Error('Not a member.');
  const remaining = conv.members.filter(m => m.userId !== userId);
  if (remaining.length === 0) {
    await db.collection('conversations').deleteOne({ _id: id });
    return;
  }
  if (getMemberRole(conv, userId) === 'owner') {
    const next = remaining.find(m => m.role === 'admin') || remaining[0];
    await db.collection('conversations').updateOne(
      { _id: id, 'members.userId': next.userId },
      { $set: { 'members.$.role': 'owner' } }
    );
  }
  await db.collection('conversations').updateOne(
    { _id: id },
    { $pull: { members: { userId } }, $set: { updatedAt: new Date() } }
  );
}

export async function updateMemberRole(conversationId, userId, targetUserId, role) {
  if (!['admin', 'member'].includes(role)) throw new Error('Role must be admin or member.');
  const id = toObjId(conversationId);
  if (!id) throw new Error('Invalid conversation ID.');
  const db = await getDb();
  const conv = await db.collection('conversations').findOne({ _id: id });
  if (!conv) throw new Error('Conversation not found.');
  if (conv.type !== 'group') throw new Error('Roles only apply to groups.');
  if (getMemberRole(conv, userId) !== 'owner') throw new Error('Only the owner can change roles.');
  const targetRole = getMemberRole(conv, targetUserId);
  if (!targetRole) throw new Error('User is not in this conversation.');
  if (targetRole === 'owner') throw new Error('Cannot change the owner role.');
  await db.collection('conversations').updateOne(
    { _id: id, 'members.userId': targetUserId },
    { $set: { 'members.$.role': role, updatedAt: new Date() } }
  );
}

export async function getMessages(conversationId, userId, before, limit = MESSAGES_PAGE_SIZE) {
  const id = toObjId(conversationId);
  if (!id) throw new Error('Invalid conversation ID.');
  const db = await getDb();
  const conv = await db.collection('conversations').findOne({ _id: id }, { projection: { members: 1 } });
  if (!conv) throw new Error('Conversation not found.');
  if (!isMember(conv, userId)) throw new Error('Access denied.');
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const query = { conversationId: id };
  if (before) {
    const beforeDate = new Date(before);
    if (!isNaN(beforeDate)) query.createdAt = { $lt: beforeDate };
  }
  const messages = await db.collection('messages')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(safeLimit + 1)
    .toArray();
  const hasMore = messages.length > safeLimit;
  return { messages: messages.slice(0, safeLimit).reverse(), hasMore };
}

export async function sendMessage(conversationId, senderId, senderName, text, replyTo) {
  const id = toObjId(conversationId);
  if (!id) throw new Error('Invalid conversation ID.');
  const db = await getDb();
  const conv = await db.collection('conversations').findOne({ _id: id });
  if (!conv) throw new Error('Conversation not found.');
  if (!isMember(conv, senderId)) throw new Error('Access denied.');
  let replyData = null;
  if (replyTo) {
    const rid = toObjId(replyTo);
    if (rid) {
      const replyMsg = await db.collection('messages').findOne({ _id: rid, conversationId: id });
      if (replyMsg) {
        replyData = {
          messageId: replyMsg._id.toString(),
          text: replyMsg.deletedAt ? 'This message was deleted' : replyMsg.text.substring(0, 100),
          senderName: replyMsg.senderName
        };
      }
    }
  }
  const doc = MessageModel.validate({ conversationId: id, senderId, senderName, text, replyTo: replyData });
  const { insertedId } = await db.collection('messages').insertOne(doc);
  const now = doc.createdAt;
  await db.collection('conversations').updateOne(
    { _id: id },
    {
      $set: {
        lastMessage: {
          messageId: insertedId.toString(),
          text: text.length > 60 ? text.substring(0, 60) + '…' : text,
          senderId,
          senderName,
          timestamp: now
        },
        updatedAt: now
      }
    }
  );
  return { _id: insertedId, ...doc };
}

export async function editMessage(conversationId, messageId, userId, text) {
  const trimmed = text?.trim();
  if (!trimmed) throw new Error('Message text cannot be empty.');
  const convId = toObjId(conversationId);
  const msgId = toObjId(messageId);
  if (!convId || !msgId) throw new Error('Invalid ID.');
  const db = await getDb();
  const message = await db.collection('messages').findOne({ _id: msgId, conversationId: convId });
  if (!message) throw new Error('Message not found.');
  if (message.senderId !== userId) throw new Error('You can only edit your own messages.');
  if (message.deletedAt) throw new Error('Cannot edit a deleted message.');
  const now = new Date();
  await db.collection('messages').updateOne({ _id: msgId }, { $set: { text: trimmed, editedAt: now } });
  return { ...message, text: trimmed, editedAt: now };
}

export async function deleteMessage(conversationId, messageId, userId) {
  const convId = toObjId(conversationId);
  const msgId = toObjId(messageId);
  if (!convId || !msgId) throw new Error('Invalid ID.');
  const db = await getDb();
  const message = await db.collection('messages').findOne({ _id: msgId, conversationId: convId });
  if (!message) throw new Error('Message not found.');
  if (message.senderId !== userId) throw new Error('You can only delete your own messages.');
  if (message.deletedAt) throw new Error('Message already deleted.');
  const now = new Date();
  await db.collection('messages').updateOne({ _id: msgId }, { $set: { deletedAt: now, text: '' } });
  return { ...message, deletedAt: now, text: '' };
}

export async function markRead(conversationId, userId) {
  const id = toObjId(conversationId);
  if (!id) throw new Error('Invalid conversation ID.');
  const db = await getDb();
  const now = new Date();
  await db.collection('conversations').updateOne(
    { _id: id, 'members.userId': userId },
    { $set: { 'members.$.lastReadAt': now } }
  );
  return now;
}

export async function searchConversations(userId, query) {
  if (!query?.trim()) return [];
  const db = await getDb();
  const normalized = query.trim().toLowerCase();
  const conversations = await db.collection('conversations').find({ 'members.userId': userId }).toArray();
  const allIds = [...new Set(conversations.flatMap(c => c.members.map(m => m.userId)))];
  const nameMap = await fetchUserNames(db, allIds);
  return conversations
    .map(conv => {
      const otherId = conv.members.find(m => m.userId !== userId)?.userId;
      const displayName = conv.type === 'direct' ? (nameMap.get(otherId) || '') : (conv.name || '');
      return { conv, displayName };
    })
    .filter(({ displayName }) => displayName.toLowerCase().includes(normalized))
    .map(({ conv, displayName }) => ({
      _id: conv._id,
      type: conv.type,
      name: displayName,
      lastMessage: conv.lastMessage,
      updatedAt: conv.updatedAt
    }));
}

export async function searchMessages(conversationId, userId, query) {
  if (!query?.trim()) return [];
  const id = toObjId(conversationId);
  if (!id) throw new Error('Invalid conversation ID.');
  const db = await getDb();
  const conv = await db.collection('conversations').findOne({ _id: id }, { projection: { members: 1 } });
  if (!conv || !isMember(conv, userId)) throw new Error('Access denied.');
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return db.collection('messages')
    .find({ conversationId: id, text: { $regex: escaped, $options: 'i' }, deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
}

export async function getUsers(userId, query) {
  const db = await getDb();
  const filter = { id: { $ne: userId } };
  if (query?.trim()) {
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }];
  }
  return db.collection('user')
    .find(filter, { projection: { id: 1, name: 1, email: 1 } })
    .limit(50)
    .toArray();
}
