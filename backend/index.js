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
import supportRouter from './routes/support.js';
import { matchmakerService, CHANCE_GAMES } from './services/matchmakerService.js';
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
app.use('/api/support', supportRouter);

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
      // eslint-disable-next-line no-unused-vars
      const { chancePlan, ...matchWithoutPlan } = result.match;
      const clientSafeMatch = {
        ...matchWithoutPlan,
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

// Reads the pre-committed outcome for a given round from the match's chancePlan.
// Both the round preview (below) and final scoring (handleSubmitScore) read this
// same value, so the animation shown to the player can never disagree with the result.
function resolveChanceOutcome(match, roundNo) {
  const outcomes = match?.chancePlan?.outcomes;
  if (!outcomes) return false;
  return !!outcomes[roundNo - 1];
}

// Lucky Wheel / Lucky Balls request this before animating a round so the wheel/ball
// visually lands on a result the server already committed to — the animation is cosmetic.
async function handleRequestRoundOutcome(socket, data) {
  const matchId = String(data?.matchId || '').trim();
  const roundNo = Number(data?.roundNo);
  if (!matchId || isNaN(roundNo)) return;
  try {
    const db = await getDb();
    const match = await db.collection('matches').findOne({ matchId });
    if (!match || !CHANCE_GAMES.has(match.gameType)) return;
    const userWins = resolveChanceOutcome(match, roundNo);
    socket.emit('round_outcome', { matchId, roundNo, userWins });
  } catch (err) {
    console.error('Error resolving round outcome:', err);
  }
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
    const isChanceGame = CHANCE_GAMES.has(match.gameType);

    let score = 0;
    let isCorrect = false;

    if (isChanceGame) {
      // Chance games (Lucky Wheel / Lucky Balls): outcome is decided server-side by the
      // match's chancePlan, never trusted from the client — real money is at stake.
      isCorrect = resolveChanceOutcome(match, roundNo);
      score = isCorrect ? 140 : 0;
    } else if (question) {
      // Quiz game: check selected index against stored correctIndex
      isCorrect = selectedIndex !== null && selectedIndex !== undefined && Number(selectedIndex) === question.correctIndex;
      score = isCorrect ? (100 + timeLeft * 2) : 0;
    } else {
      // Casino/card game: no question in DB. Client sends selectedIndex=1 for win, 0 for loss.
      // The game logic runs client-side and the result is trusted.
      isCorrect = Number(selectedIndex) === 1;
      score = isCorrect ? 140 : 0;
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

    // Broadcast that this player selected an option
    io.to(matchId).emit('player_selected', {
      matchId,
      roundNo,
      userId,
      name,
      selectedIndex
    });

    // If one of the players is 'system', simulate a system score submission automatically
    if (match.players && match.players.includes('system')) {
      const updatedSubmissions = activeScores[matchId][roundNo];
      if (!updatedSubmissions.some(e => e.userId === 'system')) {
        let botIsCorrect, botSelectedIndex, botTimeLeft, botScore;

        if (isChanceGame) {
          // Zero-sum vs the house: bot's result is the exact complement of the user's
          // server-decided outcome — one side always wins each round, never both/neither.
          botIsCorrect = !isCorrect;
          botSelectedIndex = botIsCorrect ? 1 : 0;
          botTimeLeft = Math.floor(Math.random() * 8) + 1;
          botScore = botIsCorrect ? 140 : 0;
        } else {
          botIsCorrect = Math.random() > 0.4; // 60% chance to be correct
          botSelectedIndex = botIsCorrect && question ? question.correctIndex : (question ? (question.correctIndex + 1) % 4 : 0);
          botTimeLeft = Math.floor(Math.random() * 8) + 1; // 1 to 8 seconds left
          botScore = botIsCorrect ? (100 + botTimeLeft * 2) : 0;
        }
        const systemName = match.playerNames && match.playerNames['system'] ? match.playerNames['system'] : 'Opponent';

        activeScores[matchId][roundNo].push({
          userId: 'system',
          score: botScore,
          name: systemName,
          selectedIndex: botSelectedIndex,
          isCorrect: botIsCorrect,
          socketId: null
        });

        // Broadcast bot's selection
        io.to(matchId).emit('player_selected', {
          matchId,
          roundNo,
          userId: 'system',
          name: systemName,
          selectedIndex: botSelectedIndex
        });
      }
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
        const entryFee = normTier === 'micro' ? 2 : normTier === 'rookie' ? 5 : normTier === 'pro' ? 20 : normTier === 'elite' ? 50 : 5;
        const prize = isChanceGame ? (updatedMatch.prize || 0) : entryFee * 2 * 0.80;

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
  request_round_outcome: (socket, data) => handleRequestRoundOutcome(socket, data),
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

  // Self-ping to keep the Render free tier instance warm (every 10 minutes)
  const selfPing = () => {
    const baseUrl = process.env.BETTER_AUTH_URL || `http://localhost:${PORT}`;
    fetch(`${baseUrl}/health`)
      .then(res => console.log(`Keepalive self-ping status: ${res.status}`))
      .catch(err => console.error(`Keepalive self-ping failed: ${err.message}`));
  };
  // Start pings (initial delay of 1 minute, then every 10 minutes)
  setTimeout(() => {
    selfPing();
    setInterval(selfPing, 10 * 60 * 1000);
  }, 60000);
});
