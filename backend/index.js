import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import authRouter from './routes/auth.js';
import paymentRouter from './routes/payment.js';
import walletRouter from './routes/wallet.js';
import adminRouter from './routes/admin.js';
import matchRouter from './routes/match.js';
import chatRouter from './routes/chat.js';
import { matchmakerService } from './services/matchmakerService.js';
import { initChatSocket } from './services/chat/SocketHandler.js';
import { initIndexes as initChatIndexes } from './services/chat/ChatService.js';

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/admin', adminRouter);
app.use('/api/match', matchRouter);
app.use('/api/chat', chatRouter);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'iDubbl Backend' });
});

initChatSocket(io);

// Real-time E2E score tracking cache — shared across all connections
const activeScores = {};

async function handleFindMatch(socket, data) {
  const userId = String(data?.userId || '').trim();
  const tier = String(data?.tier || '').trim();
  const name = String(data?.name || '').trim() || null;
  if (!userId || !tier) return socket.emit('matchmaking_error', { error: 'userId and tier are required.' });
  try {
    const result = await matchmakerService.findMatch(userId, tier, socket?.id, name);
    if (result.status === 'matched') {
      io.to(socket.id).emit('match_created', result.match);
      if (result.opponent?.socketId) {
        io.to(result.opponent.socketId).emit('match_created', result.match);
      }
    } else {
      socket.emit('waiting_in_queue', result.queue);
    }
  } catch (err) {
    socket.emit('matchmaking_error', { error: err.message });
  }
}

async function handleCancelMatchmaking(socket, data) {
  const userId = String(data?.userId || '').trim();
  if (!userId) return socket.emit('matchmaking_error', { error: 'userId is required.' });
  try {
    const result = await matchmakerService.cancelMatchmaking(userId);
    socket.emit('matchmaking_cancelled', result);
  } catch (err) {
    socket.emit('matchmaking_error', { error: err.message });
  }
}

function handleJoinMatchRoom(socket, data) {
  const matchId = String(data?.matchId || '').trim();
  if (!matchId) return;
  socket.join(matchId);
}

function handleSubmitScore(socket, data) {
  const matchId = String(data?.matchId || '').trim();
  const roundNo = data?.roundNo;
  const userId = String(data?.userId || '').trim();
  const score = data?.score;
  const name = String(data?.name || '').trim();
  if (!matchId || roundNo == null || !userId) return;

  if (!activeScores[matchId]) activeScores[matchId] = {};
  if (!activeScores[matchId][roundNo]) activeScores[matchId][roundNo] = [];

  const roundSubmissions = activeScores[matchId][roundNo];
  if (!roundSubmissions.some(e => e.userId === userId)) {
    activeScores[matchId][roundNo] = [...roundSubmissions, { userId, score, name, socketId: socket?.id }];
  }

  const settled = activeScores[matchId][roundNo];
  if (settled.length >= 2) {
    const [p1, p2] = settled;
    const winnerId = p1.score > p2.score ? p1.userId : p2.score > p1.score ? p2.userId : 'tie';
    const winnerName = p1.score > p2.score ? p1.name : p2.score > p1.score ? p2.name : 'tie';
    io.to(matchId).emit('round_completed', { roundNo, winnerId, winnerName, submissions: settled });
  }
}

async function handleDisconnect(socket) {
  await matchmakerService.handleDisconnect(socket?.id);
}

const matchmakingHandlers = {
  find_match: (socket, data) => handleFindMatch(socket, data),
  cancel_matchmaking: (socket, data) => handleCancelMatchmaking(socket, data),
  join_match_room: (socket, data) => handleJoinMatchRoom(socket, data),
  submit_score: (socket, data) => handleSubmitScore(socket, data),
  disconnect: (socket) => handleDisconnect(socket),
};

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket?.id}`);
  Object.entries(matchmakingHandlers).forEach(([event, handler]) => {
    socket.on(event, (...args) => handler(socket, ...args));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  try {
    await initChatIndexes();
    console.log('Chat indexes initialized');
  } catch (err) {
    console.error('Failed to initialize chat indexes:', err.message);
  }
});
