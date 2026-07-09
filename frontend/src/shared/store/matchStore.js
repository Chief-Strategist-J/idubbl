import { create } from 'zustand';
import { MOCK_MATCHES, MOCK_TIERS, WORD_DUEL_QUESTIONS } from '../mock/index.js';
import { getSocket, connectSocket } from '../services/socketService.js';
import useAuthStore from './authStore.js';

let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
  apiBase = `https://${apiBase}`;
}
const ADMIN_BASE_URL = `${apiBase}/api/admin`;

const useMatchStore = create((set, get) => ({
  matches: MOCK_MATCHES,
  tiers: MOCK_TIERS,
  queueStatus: null, // null | 'searching' | 'matched' | 'starting' | 'error'
  matchmakingError: null,
  currentTier: null,
  currentMatch: null,
  currentRound: 0,
  rounds: [],
  matchResult: null,
  questions: WORD_DUEL_QUESTIONS,
  loading: false,
  roundWaiting: false,
  roundSelections: {}, // maps userId -> selectedIndex for the current round

  fetchAdminMatches: async () => {
    set({ loading: true });
    try {
      const currentUserId = useAuthStore.getState().user?.id;
      const res = await fetch(`${ADMIN_BASE_URL}/matches`, {
        headers: currentUserId ? { 'x-user-id': currentUserId } : {},
        credentials: 'include'
      });
      const json = await res.json();
      set({ matches: json.success ? (json.data || []) : get().matches, loading: false });
    } catch (error) {
      console.error('Error fetching admin matches:', error);
      set({ loading: false });
    }
  },

  joinQueue: (tierId, userId, gameType = null) => {
    if (!tierId || !userId) return;
    const originalTier = get().tiers.find((t) => t.id === tierId);
    if (!originalTier) return;
    
    // Create a copy of tier and optionally override gameType/gameLabel
    const tier = { ...originalTier };
    if (gameType) {
      tier.gameType = gameType;
      // Convert snake_case to Title Case for display
      tier.gameLabel = gameType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    
    set({ queueStatus: 'searching', currentTier: tier, currentMatch: null, rounds: [], matchResult: null, matchmakingError: null, roundSelections: {} });

    const playerName = useAuthStore.getState().user?.name || userId;
    const socket = connectSocket(userId);
    // Guard find_match emit behind socket connection to avoid race condition
    // on cold-start backends (Render.com free tier can take 2-5s to connect)
    const emitFindMatch = () => {
      socket.emit('find_match', { userId, tier: tier.name, name: playerName, gameType: tier.gameType });
    };
    if (socket.connected) {
      emitFindMatch();
    } else {
      socket.once('connect', emitFindMatch);
    }

    // Handle incoming authoritative round scores from WebSockets E2E flow
    const listeners = {
      match_created: (match) => {
        set({ queueStatus: 'matched', matchmakingError: null });
        setTimeout(() => {
          set({ queueStatus: 'starting', currentMatch: match, currentRound: 1 });
          socket.emit('join_match_room', { matchId: match?.matchId || match?.id });
        }, 2000);
      },

      waiting_in_queue: () => {
        set({ queueStatus: 'searching' });
      },

      matchmaking_error: (data) => {
        set({ queueStatus: 'error', matchmakingError: data?.error || 'Matchmaking failed. Please try again.' });
      },

      player_selected: ({ userId: selectedUserId, selectedIndex, roundNo }) => {
        const { currentRound, roundSelections } = get();
        if (roundNo === currentRound) {
          set({
            roundSelections: {
              ...roundSelections,
              [selectedUserId.toLowerCase()]: selectedIndex
            }
          });
        }
      },

      round_completed: ({ roundNo, winnerId, winnerName, submissions, correctIndex }) => {
        const { rounds, currentMatch } = get();
        const user = useAuthStore.getState().user;
        const myId = (user?.id || user?._id || '').toLowerCase();
        const myName = user?.name || 'You';

        // Backend normalizes userIds to lowercase — use case-insensitive comparison
        const mySub = (submissions ?? []).find(s => s.userId?.toLowerCase() === myId);
        // Note: system bot can be opponent
        const oppSub = (submissions ?? []).find(s => s.userId?.toLowerCase() !== myId);

        const isTiedRound = winnerId === 'tie' || winnerId === 'draw';
        const newRound = {
          roundNo,
          winner: isTiedRound ? 'tie' : (winnerId?.toLowerCase() === myId ? myName : winnerName),
          score: `${mySub?.score ?? 0}-${oppSub?.score ?? 0}`,
          playerScore: mySub?.score ?? 0,
          opponentScore: oppSub?.score ?? 0,
          correctIndex,
          playerSelection: mySub?.selectedIndex,
          opponentSelection: oppSub?.selectedIndex,
          playerCorrect: mySub?.isCorrect,
          opponentCorrect: oppSub?.isCorrect,
        };

        const updatedRounds = [...(rounds ?? []), newRound];
        // Correctly count only actual wins, not ties
        const playerWins = updatedRounds.filter(r => r.winner === myName).length;
        const opponentWins = updatedRounds.filter(r => r.winner !== myName && r.winner !== 'tie').length;

        if (playerWins === 2 || opponentWins === 2 || updatedRounds.length === 3) {
          const isWinner = playerWins > opponentWins;
          const isTie = !isWinner && playerWins === opponentWins;
          const matchWinner = isTie ? 'tie' : (isWinner ? myName : winnerName);
          const result = {
            winner: matchWinner,
            isWinner,
            isTie,
            rounds: updatedRounds,
            prize: isWinner ? (currentMatch?.prize ?? 0) : 0,
            rake: currentMatch?.rake,
            entryFee: get().tiers.find((t) => t.name === currentMatch?.tier)?.entryFee || 0,
            tierName: currentMatch?.tier,
            refId: currentMatch?.refId || currentMatch?.matchId,
            settledAt: new Date().toISOString()
          };
          set({
            rounds: updatedRounds,
            matchResult: result,
            currentMatch: { ...currentMatch, status: 'completed', winner: matchWinner },
            roundSelections: {}
          });
        } else {
          set({ rounds: updatedRounds, currentRound: roundNo + 1, roundWaiting: false, roundSelections: {} });
        }
      }
    };

    Object.entries(listeners).forEach(([event, handler]) => {
      socket.off(event);
      socket.on(event, handler);
    });

    // Re-enter queue automatically if the socket drops and reconnects while searching
    socket.io.off('reconnect');
    socket.io.on('reconnect', () => {
      if (get().queueStatus === 'searching') {
        const currentTier = get().currentTier;
        if (currentTier) {
          socket.emit('find_match', { userId, tier: currentTier.name, name: playerName, gameType: currentTier.gameType });
        }
      }
    });
  },

  leaveQueue: (userId) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('cancel_matchmaking', { userId });
    }
    set({ queueStatus: null, currentTier: null, matchmakingError: null, roundSelections: {} });
  },

  simulateMatch: (matchId) => {
    const match = get().matches.find((m) => m.id === matchId);
    set({ currentMatch: match, currentRound: 1, queueStatus: 'starting', rounds: [], roundSelections: {} });
  },

  startNewMatch: (tier) => {
    if (!tier) return;
    const user = useAuthStore.getState().user;
    const opps = ['Viper', 'Spike', 'Shadow', 'Ghost', 'Nova'];
    const newMatch = {
      id: `m${Date.now()}`,
      tier: tier.name,
      player1: user?.name || 'You',
      player2: opps[Math.floor(Math.random() * opps.length)],
      status: 'active',
      winner: null,
      winnerId: null,
      rounds: [],
      prize: tier.prize,
      rake: Math.floor(tier.entryFee * 2 * (tier.rakePercent / 100)),
      startedAt: new Date().toISOString(),
      endedAt: null,
      refId: `M-${Date.now()}`,
    };
    set({ currentMatch: newMatch, currentRound: 1, queueStatus: null, rounds: [], matchResult: null, roundSelections: {} });
    return newMatch;
  },

  submitRoundResult: (selectedIndex, timeLeft) => {
    const { currentMatch, currentRound } = get();
    if (!currentMatch) return;
    const socket = getSocket();
    const user = useAuthStore.getState().user;

    set({ roundWaiting: true });

    if (socket?.connected) {
      socket.emit('submit_score', {
        matchId: currentMatch?.matchId || currentMatch?.id,
        roundNo: currentRound,
        userId: user?.id || user?._id || '',
        selectedIndex,
        timeLeft,
        name: user?.name || 'You'
      });
    }
  },

  clearMatch: () => {
    set({ currentMatch: null, currentRound: 0, rounds: [], matchResult: null, queueStatus: null, currentTier: null, matchmakingError: null, roundWaiting: false, roundSelections: {} });
  },

  getRandomQuestion: (index) => {
    const q = get().questions;
    return q[index % q.length];
  },
}));

export default useMatchStore;
