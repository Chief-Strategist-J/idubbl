import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { getDb } from '../services/db.js';
import * as ChatService from '../services/chat/ChatService.js';
import { sendMatchMessage, getMatchMessages, clearMatchRoom } from '../services/chat/MatchChatService.js';

const TS = Date.now();
const uid = (n) => `chat_test_user_${n}_${TS}`;
const U1 = uid(1);
const U2 = uid(2);
const U3 = uid(3);
const U4 = uid(4);

const createdConvIds = [];
const createdMsgIds = [];

async function seedUsers(db) {
  await db.collection('user').insertMany([
    { id: U1, name: 'Alice Test', email: `alice_${TS}@test.com` },
    { id: U2, name: 'Bob Test',   email: `bob_${TS}@test.com` },
    { id: U3, name: 'Carol Test', email: `carol_${TS}@test.com` },
    { id: U4, name: 'Dan Test',   email: `dan_${TS}@test.com` }
  ]);
}

async function cleanup(db) {
  const convFilter = { _id: { $in: createdConvIds } };
  const ids = createdConvIds.map(id => new ObjectId(id.toString()));
  await db.collection('conversations').deleteMany({ _id: { $in: ids } });
  await db.collection('messages').deleteMany({
    conversationId: { $in: ids }
  });
  await db.collection('user').deleteMany({ id: { $in: [U1, U2, U3, U4] } });
}

before(async () => {
  const db = await getDb();
  await seedUsers(db);
});

after(async () => {
  const db = await getDb();
  await cleanup(db);
});

function trackConv(conv) {
  createdConvIds.push(conv._id);
  return conv;
}

test('getOrCreateDirect — creates a new direct conversation', async () => {
  const conv = trackConv(await ChatService.getOrCreateDirect(U1, U2));
  assert.equal(conv.type, 'direct');
  assert.equal(conv.name, 'Bob Test');
  assert.equal(conv.members.length, 2);
  assert.ok(conv.members.some(m => m.userId === U1));
  assert.ok(conv.members.some(m => m.userId === U2));
  assert.equal(conv.unreadCount, 0);
  assert.ok(conv._id);
});

test('getOrCreateDirect — returns existing conversation on duplicate call', async () => {
  const first  = await ChatService.getOrCreateDirect(U1, U2);
  const second = await ChatService.getOrCreateDirect(U2, U1);
  assert.equal(first._id.toString(), second._id.toString());
});

test('getOrCreateDirect — throws when userId equals targetUserId', async () => {
  await assert.rejects(
    () => ChatService.getOrCreateDirect(U1, U1),
    /Invalid target user/
  );
});

test('createGroup — creates group with owner role for creator', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Test Group Alpha', [U2, U3]));
  assert.equal(conv.type, 'group');
  assert.equal(conv.name, 'Test Group Alpha');
  assert.equal(conv.members.length, 3);
  const ownerMember = conv.members.find(m => m.userId === U1);
  assert.equal(ownerMember.role, 'owner');
  const memberRole = conv.members.find(m => m.userId === U2).role;
  assert.equal(memberRole, 'member');
});

test('createGroup — deduplicates creator from memberIds', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Dedup Group', [U1, U2]));
  const u1Count = conv.members.filter(m => m.userId === U1).length;
  assert.equal(u1Count, 1);
});

test('createGroup — throws when fewer than 2 total members', async () => {
  await assert.rejects(
    () => ChatService.createGroup(U1, 'Solo Group', []),
    /at least 2 members/
  );
});

test('createGroup — throws when group name is missing', async () => {
  await assert.rejects(
    () => ChatService.createGroup(U1, '', [U2]),
    /name is required/i
  );
});

test('sendMessage — creates message and updates lastMessage on conversation', async () => {
  const conv = trackConv(await ChatService.getOrCreateDirect(U3, U4));
  const msg = await ChatService.sendMessage(conv._id.toString(), U3, 'Carol Test', 'Hello Bob!');
  createdMsgIds.push(msg._id);

  assert.equal(msg.senderId, U3);
  assert.equal(msg.text, 'Hello Bob!');
  assert.equal(msg.senderName, 'Carol Test');
  assert.ok(msg.createdAt);
  assert.equal(msg.deletedAt, null);
  assert.equal(msg.editedAt, null);

  const db = await getDb();
  const updated = await db.collection('conversations').findOne({ _id: conv._id });
  assert.ok(updated.lastMessage);
  assert.equal(updated.lastMessage.senderId, U3);
  assert.equal(updated.lastMessage.text, 'Hello Bob!');
});

test('sendMessage — throws when sender is not a member', async () => {
  const conv = trackConv(await ChatService.getOrCreateDirect(U1, U2));
  await assert.rejects(
    () => ChatService.sendMessage(conv._id.toString(), U3, 'Carol', 'Intruder!'),
    /Access denied/
  );
});

test('getMessages — returns messages in ascending chronological order', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Order Test Group', [U2]));
  const texts = ['first', 'second', 'third'];
  for (const t of texts) {
    await ChatService.sendMessage(conv._id.toString(), U1, 'Alice', t);
  }
  const { messages, hasMore } = await ChatService.getMessages(conv._id.toString(), U1);
  assert.equal(messages.length, 3);
  assert.equal(messages[0].text, 'first');
  assert.equal(messages[2].text, 'third');
  assert.equal(hasMore, false);
});

test('getMessages — paginates with before cursor', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Pagination Group', [U2]));
  const msgs = [];
  for (let i = 1; i <= 5; i++) {
    msgs.push(await ChatService.sendMessage(conv._id.toString(), U1, 'Alice', `msg${i}`));
    await new Promise(r => setTimeout(r, 2));
  }
  const pivot = msgs[2].createdAt.toISOString();
  const { messages } = await ChatService.getMessages(conv._id.toString(), U1, pivot);
  assert.ok(messages.every(m => new Date(m.createdAt) < new Date(pivot)));
  assert.equal(messages.length, 2);
});

test('getMessages — hasMore is true when messages exceed limit', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'HasMore Group', [U2]));
  for (let i = 0; i < 5; i++) {
    await ChatService.sendMessage(conv._id.toString(), U1, 'Alice', `bulk${i}`);
  }
  const { messages, hasMore } = await ChatService.getMessages(conv._id.toString(), U1, undefined, 3);
  assert.equal(messages.length, 3);
  assert.equal(hasMore, true);
});

test('editMessage — updates text and sets editedAt', async () => {
  const conv = trackConv(await ChatService.getOrCreateDirect(U1, U2));
  const msg = await ChatService.sendMessage(conv._id.toString(), U1, 'Alice', 'original text');
  const edited = await ChatService.editMessage(conv._id.toString(), msg._id.toString(), U1, 'updated text');
  assert.equal(edited.text, 'updated text');
  assert.ok(edited.editedAt);
  assert.equal(edited.deletedAt, null);
});

test('editMessage — throws when caller is not the sender', async () => {
  const conv = trackConv(await ChatService.getOrCreateDirect(U1, U2));
  const msg = await ChatService.sendMessage(conv._id.toString(), U1, 'Alice', 'Alice message');
  await assert.rejects(
    () => ChatService.editMessage(conv._id.toString(), msg._id.toString(), U2, 'Bob sneaks edit'),
    /your own messages/
  );
});

test('editMessage — throws when message is deleted', async () => {
  const conv = trackConv(await ChatService.getOrCreateDirect(U1, U2));
  const msg = await ChatService.sendMessage(conv._id.toString(), U1, 'Alice', 'to be deleted');
  await ChatService.deleteMessage(conv._id.toString(), msg._id.toString(), U1);
  await assert.rejects(
    () => ChatService.editMessage(conv._id.toString(), msg._id.toString(), U1, 'edit deleted'),
    /deleted/
  );
});

test('deleteMessage — soft deletes: sets deletedAt and clears text', async () => {
  const conv = trackConv(await ChatService.getOrCreateDirect(U1, U2));
  const msg = await ChatService.sendMessage(conv._id.toString(), U1, 'Alice', 'delete me');
  const deleted = await ChatService.deleteMessage(conv._id.toString(), msg._id.toString(), U1);
  assert.ok(deleted.deletedAt);
  assert.equal(deleted.text, '');

  const db = await getDb();
  const inDb = await db.collection('messages').findOne({ _id: msg._id });
  assert.ok(inDb.deletedAt);
  assert.equal(inDb.text, '');
});

test('deleteMessage — throws when caller is not the sender', async () => {
  const conv = trackConv(await ChatService.getOrCreateDirect(U1, U2));
  const msg = await ChatService.sendMessage(conv._id.toString(), U1, 'Alice', 'protected');
  await assert.rejects(
    () => ChatService.deleteMessage(conv._id.toString(), msg._id.toString(), U2, ),
    /your own messages/
  );
});

test('markRead — updates member lastReadAt', async () => {
  const conv = trackConv(await ChatService.getOrCreateDirect(U1, U2));
  const before = new Date();
  await ChatService.markRead(conv._id.toString(), U1);
  const db = await getDb();
  const updated = await db.collection('conversations').findOne({ _id: conv._id });
  const member = updated.members.find(m => m.userId === U1);
  assert.ok(member.lastReadAt > before);
});

test('updateGroupName — updates name for admin/owner', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Old Name', [U2]));
  const newName = await ChatService.updateGroupName(conv._id.toString(), U1, 'New Name');
  assert.equal(newName, 'New Name');
  const db = await getDb();
  const updated = await db.collection('conversations').findOne({ _id: conv._id });
  assert.equal(updated.name, 'New Name');
});

test('updateGroupName — throws for non-admin member', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Locked Name', [U2]));
  await assert.rejects(
    () => ChatService.updateGroupName(conv._id.toString(), U2, 'Hijacked Name'),
    /Only admins and owners/
  );
});

test('addMembers — adds new members with member role', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Add Members Group', [U2]));
  const added = await ChatService.addMembers(conv._id.toString(), U1, [U3]);
  assert.equal(added.length, 1);
  assert.equal(added[0].userId, U3);
  assert.equal(added[0].role, 'member');
  const db = await getDb();
  const updated = await db.collection('conversations').findOne({ _id: conv._id });
  assert.ok(updated.members.some(m => m.userId === U3));
});

test('addMembers — ignores already-present members', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Dedup Add Group', [U2]));
  const added = await ChatService.addMembers(conv._id.toString(), U1, [U2]);
  assert.equal(added.length, 0);
});

test('removeMember — removes a non-owner member', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Remove Member Group', [U2, U3]));
  await ChatService.removeMember(conv._id.toString(), U1, U2);
  const db = await getDb();
  const updated = await db.collection('conversations').findOne({ _id: conv._id });
  assert.ok(!updated.members.some(m => m.userId === U2));
});

test('removeMember — throws when trying to remove the owner', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Owner Protect Group', [U2]));
  await assert.rejects(
    () => ChatService.removeMember(conv._id.toString(), U2, U1),
    /Only admins and owners/
  );
});

test('leaveGroup — removes user from members', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Leave Group Test', [U2, U3]));
  await ChatService.leaveGroup(conv._id.toString(), U2);
  const db = await getDb();
  const updated = await db.collection('conversations').findOne({ _id: conv._id });
  assert.ok(!updated.members.some(m => m.userId === U2));
});

test('leaveGroup — transfers ownership when owner leaves', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Owner Leave Group', [U2, U3]));
  await ChatService.leaveGroup(conv._id.toString(), U1);
  const db = await getDb();
  const updated = await db.collection('conversations').findOne({ _id: conv._id });
  assert.ok(!updated.members.some(m => m.userId === U1));
  const newOwner = updated.members.find(m => m.role === 'owner');
  assert.ok(newOwner);
});

test('leaveGroup — throws on a direct conversation', async () => {
  const conv = trackConv(await ChatService.getOrCreateDirect(U1, U2));
  await assert.rejects(
    () => ChatService.leaveGroup(conv._id.toString(), U1),
    /Cannot leave a direct conversation/
  );
});

test('searchConversations — finds conversations by name', async () => {
  const conv = trackConv(await ChatService.createGroup(U1, 'Searchable Unique Group XYZ', [U2]));
  const results = await ChatService.searchConversations(U1, 'Searchable Unique');
  assert.ok(results.some(r => r._id.toString() === conv._id.toString()));
});

test('searchConversations — returns empty for no match', async () => {
  const results = await ChatService.searchConversations(U1, 'NOMATCHWHATSOEVER99999');
  assert.equal(results.length, 0);
});

test('getUsers — excludes the requesting user', async () => {
  const users = await ChatService.getUsers(U1, 'Test');
  assert.ok(!users.some(u => u.id === U1));
});

test('getUsers — filters by query', async () => {
  const users = await ChatService.getUsers(U1, 'Bob Test');
  assert.ok(users.some(u => u.id === U2));
});

test('MatchChatService — sendMatchMessage creates message with correct fields', () => {
  const matchId = `match_test_${TS}`;
  const msg = sendMatchMessage(matchId, U1, 'Alice', 'GG!');
  assert.equal(msg.matchId, matchId);
  assert.equal(msg.userId, U1);
  assert.equal(msg.userName, 'Alice');
  assert.equal(msg.text, 'GG!');
  assert.ok(msg.id);
  assert.ok(msg.createdAt);
  clearMatchRoom(matchId);
});

test('MatchChatService — getMatchMessages returns all messages in order', () => {
  const matchId = `match_order_${TS}`;
  sendMatchMessage(matchId, U1, 'Alice', 'msg1');
  sendMatchMessage(matchId, U2, 'Bob',   'msg2');
  sendMatchMessage(matchId, U1, 'Alice', 'msg3');
  const msgs = getMatchMessages(matchId);
  assert.equal(msgs.length, 3);
  assert.equal(msgs[0].text, 'msg1');
  assert.equal(msgs[2].text, 'msg3');
  clearMatchRoom(matchId);
});

test('MatchChatService — clearMatchRoom removes all messages', () => {
  const matchId = `match_clear_${TS}`;
  sendMatchMessage(matchId, U1, 'Alice', 'bye');
  clearMatchRoom(matchId);
  assert.equal(getMatchMessages(matchId).length, 0);
});

test('MatchChatService — throws when required fields are missing', () => {
  assert.throws(() => sendMatchMessage('', U1, 'Alice', 'text'), /required/);
  assert.throws(() => sendMatchMessage('m1', '', 'Alice', 'text'), /required/);
  assert.throws(() => sendMatchMessage('m1', U1, 'Alice', '  '), /required/);
});

test('MatchChatService — getMatchMessages returns empty for unknown matchId', () => {
  const msgs = getMatchMessages(`nonexistent_match_${TS}`);
  assert.deepEqual(msgs, []);
});

console.log('ChatService tests loaded — run with: node --test backend/test/chatService.test.js');
