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
import kycRouter from './routes/kyc.js';
import { matchmakerService } from './services/matchmakerService.js';
import { initChatSocket } from './services/chat/SocketHandler.js';
import { initIndexes as initChatIndexes } from './services/chat/ChatService.js';
import { initCoreIndexes } from './services/dbIndexes.js';
import { getDb } from './services/db.js';
import { cacheMiddleware } from './services/cacheService.js';
import compression from 'compression';

const app = express();
app.use(compression());
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['set-auth-token']
}));
app.use(express.json());
app.use(cacheMiddleware());

app.use('/api/auth', authRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/admin', adminRouter);
app.use('/api/match', matchRouter);
app.use('/api/chat', chatRouter);
app.use('/api/kyc', kycRouter);

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
  const gameType = String(data?.gameType || 'word_duel').trim();
  if (!userId || !tier) return socket.emit('matchmaking_error', { error: 'userId and tier are required.' });
  try {
    const result = await matchmakerService.findMatch(userId, tier, socket?.id, name, gameType);
    if (result.status === 'matched') {
      // Strip correctIndex from the questions array sent to the clients for security
      const clientSafeQuestions = (result.match.questions || []).map(q => {
        const safe = {
          category: q.category,
          difficulty: q.difficulty,
          options: q.options
        };
        if (q.question) safe.question = q.question;
        if (q.expression) safe.expression = q.expression;
        return safe;
      });
      const clientSafeMatch = {
        ...result.match,
        questions: clientSafeQuestions
      };
      
      io.to(socket.id).emit('match_created', clientSafeMatch);
      if (result.opponent?.socketId) {
        io.to(result.opponent.socketId).emit('match_created', clientSafeMatch);
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

async function handleSubmitScore(socket, data) {
  const matchId = String(data?.matchId || '').trim();
  const roundNo = Number(data?.roundNo);
  const userId = String(data?.userId || '').trim();
  const selectedIndex = data?.selectedIndex;
  const timeLeft = Number(data?.timeLeft || 0);
  const name = String(data?.name || '').trim();
  
  if (!matchId || roundNo == null || isNaN(roundNo) || !userId) return;

  try {
    const db = await getDb();
    const match = await db.collection('matches').findOne({ matchId });
    if (!match) {
      console.error(`Match ${matchId} not found for score submission.`);
      return;
    }

    const questionIndex = roundNo - 1;
    const questions = match.questions || [];
    const question = questions[questionIndex];

    let score = 0;
    let isCorrect = false;

    if (question) {
      isCorrect = selectedIndex !== null && selectedIndex !== undefined && Number(selectedIndex) === question.correctIndex;
      score = isCorrect ? (100 + timeLeft * 2) : 0;
    } else {
      console.warn(`No question found for round ${roundNo} in match ${matchId}`);
    }

    if (!activeScores[matchId]) activeScores[matchId] = {};
    if (!activeScores[matchId][roundNo]) activeScores[matchId][roundNo] = [];

    const roundSubmissions = activeScores[matchId][roundNo];
    if (!roundSubmissions.some(e => e.userId === userId)) {
      activeScores[matchId][roundNo] = [
        ...roundSubmissions,
        { userId, score, name, selectedIndex, isCorrect, socketId: socket?.id }
      ];
    }

    const settled = activeScores[matchId][roundNo];
    if (settled.length >= 2) {
      const [p1, p2] = settled;
      
      let winnerId = 'tie';
      let winnerName = 'tie';
      if (p1.score > p2.score) {
        winnerId = p1.userId;
        winnerName = p1.name;
      } else if (p2.score > p1.score) {
        winnerId = p2.userId;
        winnerName = p2.name;
      }

      const correctIndex = question ? question.correctIndex : 0;

      io.to(matchId).emit('round_completed', { 
        roundNo, 
        winnerId, 
        winnerName, 
        submissions: settled,
        correctIndex 
      });

      await db.collection('matches').updateOne(
        { matchId },
        {
          $push: {
            rounds: {
              roundNo,
              winnerId,
              winnerName,
              submissions: settled.map(s => ({
                userId: s.userId,
                name: s.name,
                score: s.score,
                isCorrect: s.isCorrect
              }))
            }
          }
        }
      );

      const updatedMatch = await db.collection('matches').findOne({ matchId });
      const matchRounds = updatedMatch.rounds || [];
      const userWins = {};
      
      matchRounds.forEach(r => {
        if (r.winnerId && r.winnerId !== 'tie') {
          userWins[r.winnerId] = (userWins[r.winnerId] || 0) + 1;
        }
      });

      const player1 = updatedMatch.players[0];
      const player2 = updatedMatch.players[1];
      const p1Wins = userWins[player1] || 0;
      const p2Wins = userWins[player2] || 0;

      if (p1Wins === 2 || p2Wins === 2 || matchRounds.length >= 3) {
        let finalWinnerId = null;
        let finalWinnerName = null;

        if (p1Wins > p2Wins) {
          finalWinnerId = player1;
          finalWinnerName = updatedMatch.playerNames[player1];
        } else if (p2Wins > p1Wins) {
          finalWinnerId = player2;
          finalWinnerName = updatedMatch.playerNames[player2];
        } else {
          finalWinnerId = 'tie';
          finalWinnerName = 'tie';
        }

        const normTier = (updatedMatch.tier || '').toLowerCase().trim();
        const entryFee = normTier === 'micro' ? 1 : normTier === 'rookie' ? 5 : normTier === 'pro' ? 20 : normTier === 'elite' ? 50 : 5;
        const prize = entryFee * 2 * 0.80;

        await matchmakerService.endMatch(matchId, finalWinnerId, prize);
      }
    }
  } catch (err) {
    console.error('Error handling submit score:', err);
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
  try {
    await initCoreIndexes();
    console.log('Core indexes initialized');
  } catch (err) {
    console.error('Failed to initialize core indexes:', err.message);
  }
});
