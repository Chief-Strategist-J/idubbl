import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import authRouter from './routes/auth.js';
import paymentRouter from './routes/payment.js';
import walletRouter from './routes/wallet.js';
import adminRouter from './routes/admin.js';

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

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
