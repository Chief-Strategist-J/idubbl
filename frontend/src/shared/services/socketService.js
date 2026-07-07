import { io } from 'socket.io-client';

let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
  apiBase = `https://${apiBase}`;
}

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(apiBase, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}

export function connectSocket(userId) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    // chat:join will be emitted once connected (after handshake completes)
    s.once('connect', () => {
      s.emit('chat:join', userId);
    });
  } else {
    s.emit('chat:join', userId);
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
