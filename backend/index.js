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

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('find_match', async (data) => {
    try {
      const { userId, tier } = data;
      const result = await matchmakerService.findMatch(userId, tier, socket.id);
      
      if (result.status === 'matched') {
        // Notify both players instantly
        io.to(socket.id).emit('match_created', result.match);
        if (result.opponent.socketId) {
          io.to(result.opponent.socketId).emit('match_created', result.match);
        }
      } else {
        socket.emit('waiting_in_queue', result.queue);
      }
    } catch (err) {
      socket.emit('matchmaking_error', { error: err.message });
    }
  });

  socket.on('cancel_matchmaking', async (data) => {
    try {
      const { userId } = data;
      const result = await matchmakerService.cancelMatchmaking(userId);
      socket.emit('matchmaking_cancelled', result);
    } catch (err) {
      socket.emit('matchmaking_error', { error: err.message });
    }
  });

  socket.on('disconnect', async () => {
    console.log(`Client disconnected: ${socket.id}`);
    await matchmakerService.handleDisconnect(socket.id);
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
