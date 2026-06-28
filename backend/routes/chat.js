import express from 'express';
import { errorRegistry } from '../services/errorRegistry.js';
import * as ChatService from '../services/chat/ChatService.js';

const router = express.Router();

function getUserId(req) {
  return req.headers['x-user-id'];
}

function handleError(res, err) {
  const msg = err.message || 'An unexpected error occurred.';
  if (msg.includes('not found')) return res.status(404).json({ success: false, message: msg });
  if (msg.includes('Access denied') || msg.includes('Only') || msg.includes('Cannot')) {
    return res.status(403).json({ success: false, message: msg });
  }
  if (msg.includes('required') || msg.includes('Invalid') || msg.includes('empty') || msg.includes('yourself') || msg.includes('members')) {
    return res.status(400).json({ success: false, message: msg });
  }
  console.error('[Chat]', err);
  return errorRegistry.send(res, 'DATABASE_ERROR');
}

router.get('/conversations', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  try {
    const conversations = await ChatService.getConversations(userId);
    res.json({ success: true, data: conversations });
  } catch (err) { handleError(res, err); }
});

router.post('/conversations/direct', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  const { targetUserId } = req.body;
  if (!targetUserId?.trim()) return res.status(400).json({ success: false, message: 'targetUserId is required.' });
  try {
    const conv = await ChatService.getOrCreateDirect(userId, targetUserId.trim());
    res.json({ success: true, data: conv });
  } catch (err) { handleError(res, err); }
});

router.post('/conversations/group', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  const { name, memberIds } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Group name is required.' });
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ success: false, message: 'memberIds must be a non-empty array.' });
  }
  try {
    const conv = await ChatService.createGroup(userId, name.trim(), memberIds);
    res.json({ success: true, data: conv });
  } catch (err) { handleError(res, err); }
});

router.get('/conversations/:id', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  try {
    const conv = await ChatService.getConversation(req.params.id, userId);
    res.json({ success: true, data: conv });
  } catch (err) { handleError(res, err); }
});

router.delete('/conversations/:id', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  try {
    await ChatService.deleteConversation(req.params.id, userId);
    res.json({ success: true });
  } catch (err) { handleError(res, err); }
});

router.patch('/conversations/:id/name', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  const { name } = req.body;
  try {
    const newName = await ChatService.updateGroupName(req.params.id, userId, name);
    res.json({ success: true, data: { name: newName } });
  } catch (err) { handleError(res, err); }
});

router.post('/conversations/:id/members', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  const { memberIds } = req.body;
  try {
    const added = await ChatService.addMembers(req.params.id, userId, memberIds);
    res.json({ success: true, data: { added } });
  } catch (err) { handleError(res, err); }
});

router.delete('/conversations/:id/members/:targetId', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  try {
    await ChatService.removeMember(req.params.id, userId, req.params.targetId);
    res.json({ success: true });
  } catch (err) { handleError(res, err); }
});

router.post('/conversations/:id/leave', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  try {
    await ChatService.leaveGroup(req.params.id, userId);
    res.json({ success: true });
  } catch (err) { handleError(res, err); }
});

router.patch('/conversations/:id/members/:targetId/role', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  const { role } = req.body;
  try {
    await ChatService.updateMemberRole(req.params.id, userId, req.params.targetId, role);
    res.json({ success: true });
  } catch (err) { handleError(res, err); }
});

router.get('/conversations/:id/messages', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  const { before, limit } = req.query;
  try {
    const result = await ChatService.getMessages(req.params.id, userId, before, limit ? parseInt(limit) : undefined);
    res.json({ success: true, data: result });
  } catch (err) { handleError(res, err); }
});

router.post('/conversations/:id/messages', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  const { text, replyTo, senderName } = req.body;
  if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message text is required.' });
  try {
    const message = await ChatService.sendMessage(req.params.id, userId, senderName || '', text, replyTo);
    res.json({ success: true, data: message });
  } catch (err) { handleError(res, err); }
});

router.patch('/conversations/:id/messages/:msgId', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  const { text } = req.body;
  try {
    const message = await ChatService.editMessage(req.params.id, req.params.msgId, userId, text);
    res.json({ success: true, data: message });
  } catch (err) { handleError(res, err); }
});

router.delete('/conversations/:id/messages/:msgId', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  try {
    await ChatService.deleteMessage(req.params.id, req.params.msgId, userId);
    res.json({ success: true });
  } catch (err) { handleError(res, err); }
});

router.post('/conversations/:id/read', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  try {
    const readAt = await ChatService.markRead(req.params.id, userId);
    res.json({ success: true, data: { readAt } });
  } catch (err) { handleError(res, err); }
});

router.get('/search/conversations', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  try {
    const results = await ChatService.searchConversations(userId, req.query.q);
    res.json({ success: true, data: results });
  } catch (err) { handleError(res, err); }
});

router.get('/search/messages', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  const { conversationId, q } = req.query;
  if (!conversationId) return res.status(400).json({ success: false, message: 'conversationId is required.' });
  try {
    const results = await ChatService.searchMessages(conversationId, userId, q);
    res.json({ success: true, data: results });
  } catch (err) { handleError(res, err); }
});

router.get('/users', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return errorRegistry.send(res, 'UNAUTHORIZED');
  try {
    const users = await ChatService.getUsers(userId, req.query.q);
    res.json({ success: true, data: users });
  } catch (err) { handleError(res, err); }
});

export default router;
