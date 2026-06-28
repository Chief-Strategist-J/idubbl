const roomMessages = new Map();
const ROOM_TTL_MS = 4 * 60 * 60 * 1000;
const roomTimers = new Map();

function scheduleCleanup(matchId) {
  const existing = roomTimers.get(matchId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    roomMessages.delete(matchId);
    roomTimers.delete(matchId);
  }, ROOM_TTL_MS);
  roomTimers.set(matchId, timer);
}

export function sendMatchMessage(matchId, userId, userName, text) {
  const trimmed = text?.trim();
  if (!matchId || !userId || !trimmed) throw new Error('matchId, userId, and text are required.');
  const message = {
    id: `${matchId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    matchId,
    userId,
    userName: userName?.trim() || 'Player',
    text: trimmed,
    createdAt: new Date()
  };
  if (!roomMessages.has(matchId)) roomMessages.set(matchId, []);
  roomMessages.get(matchId).push(message);
  scheduleCleanup(matchId);
  return message;
}

export function getMatchMessages(matchId) {
  return roomMessages.get(matchId) ?? [];
}

export function clearMatchRoom(matchId) {
  roomMessages.delete(matchId);
  const timer = roomTimers.get(matchId);
  if (timer) { clearTimeout(timer); roomTimers.delete(matchId); }
}
