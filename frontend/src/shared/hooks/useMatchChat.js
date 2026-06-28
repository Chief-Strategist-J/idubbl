import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socketService.js';

export function useMatchChat(matchId, userId, userName) {
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const isOpenRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!matchId || !userId) return;
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('match:chat:join', { matchId });

    function onHistory({ messages: history }) {
      setMessages(history);
    }

    function onMessage(msg) {
      setMessages(prev => [...prev, msg]);
      if (!isOpenRef.current && msg.userId !== userId) {
        setUnread(n => n + 1);
      }
    }

    socket.on('match:chat:history', onHistory);
    socket.on('match:chat:message', onMessage);

    return () => {
      socket.off('match:chat:history', onHistory);
      socket.off('match:chat:message', onMessage);
      socket.emit('match:chat:leave', { matchId });
    };
  }, [matchId, userId]);

  const sendMessage = useCallback((text) => {
    if (!text?.trim() || !matchId) return;
    getSocket().emit('match:chat:send', { matchId, text: text.trim(), userName });
  }, [matchId, userName]);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) setUnread(0);
      return !prev;
    });
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return { messages, sendMessage, isOpen, toggle, close, unread };
}
