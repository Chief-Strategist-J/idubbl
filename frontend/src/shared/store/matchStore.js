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

  fetchAdminMatches: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${ADMIN_BASE_URL}/matches`, {
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        set({ matches: json.data || [], loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching admin matches:', error);
      set({ loading: false });
    }
  },

  joinQueue: (tierId, userId) => {
    const tier = get().tiers.find((t) => t.id === tierId);
    set({ queueStatus: 'searching', currentTier: tier, currentMatch: null, rounds: [], matchResult: null, matchmakingError: null });

    const playerName = useAuthStore.getState().user?.name || userId;
    const socket = connectSocket(userId);
    socket.emit('find_match', { userId, tier: tier.name, name: playerName });

    socket.off('match_created');
    socket.on('match_created', (match) => {
      set({ queueStatus: 'matched', matchmakingError: null });
      setTimeout(() => {
        set({ queueStatus: 'starting', currentMatch: match, currentRound: 1 });
        socket.emit('join_match_room', { matchId: match.matchId || match.id });
      }, 2000);
    });

    socket.off('waiting_in_queue');
    socket.on('waiting_in_queue', () => {
      set({ queueStatus: 'searching' });
    });

    socket.off('matchmaking_error');
    socket.on('matchmaking_error', (data) => {
      set({ queueStatus: 'error', matchmakingError: data?.error || 'Matchmaking failed. Please try again.' });
    });

    // Handle incoming authoritative round scores from WebSockets E2E flow
    socket.off('round_completed');
    socket.on('round_completed', ({ roundNo, winnerId, winnerName, submissions }) => {
      const { rounds, currentMatch, currentRound } = get();
      const user = useAuthStore.getState().user;
      const myId = user?.id || 'u1';

      const mySub = submissions.find(s => s.userId === myId);
      const oppSub = submissions.find(s => s.userId !== myId);

      const playerScore = mySub ? mySub.score : 0;
      const opponentScore = oppSub ? oppSub.score : 0;

      const userWinner = winnerId === myId ? (user?.name || 'You') : winnerName;

      const newRound = {
        roundNo,
        winner: userWinner,
        score: `${playerScore}-${opponentScore}`,
        playerScore,
        opponentScore
      };

      const updatedRounds = [...rounds, newRound];
      const playerWins = updatedRounds.filter(r => r.winner === (user?.name || 'You')).length;
      const opponentWins = updatedRounds.filter(r => r.winner !== (user?.name || 'You')).length;

      if (playerWins === 2 || opponentWins === 2 || updatedRounds.length === 3) {
        const matchWinner = playerWins > opponentWins ? (user?.name || 'You') : winnerName;
        const isWinner = playerWins > opponentWins;
        const result = {
          winner: matchWinner,
          isWinner,
          rounds: updatedRounds,
          prize: isWinner ? currentMatch.prize : 0,
          rake: currentMatch.rake,
          entryFee: get().tiers.find((t) => t.name === currentMatch.tier)?.entryFee || 0,
          tierName: currentMatch.tier,
          refId: currentMatch.refId || currentMatch.matchId,
          settledAt: new Date().toISOString()
        };
        set({ rounds: updatedRounds, matchResult: result, currentMatch: { ...currentMatch, status: 'completed', winner: matchWinner } });
      } else {
        set({ rounds: updatedRounds, currentRound: roundNo + 1, roundWaiting: false });
      }
    });

    // Re-enter queue automatically if the socket drops and reconnects while searching
    socket.io.off('reconnect');
    socket.io.on('reconnect', () => {
      if (get().queueStatus === 'searching') {
        const currentTier = get().currentTier;
        if (currentTier) {
          socket.emit('find_match', { userId, tier: currentTier.name, name: playerName });
        }
      }
    });
  },

  leaveQueue: (userId) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('cancel_matchmaking', { userId });
    }
    set({ queueStatus: null, currentTier: null, matchmakingError: null });
  },

  simulateMatch: (matchId) => {
    const match = get().matches.find((m) => m.id === matchId);
    set({ currentMatch: match, currentRound: 1, queueStatus: 'starting', rounds: [] });
  },

  startNewMatch: (tier) => {
    const user = useAuthStore.getState().user;
    const opps = ['Viper', 'Spike', 'Shadow', 'Ghost', 'Nova'];
    const randomOpp = opps[Math.floor(Math.random() * opps.length)];
    const newMatch = {
      id: `m${Date.now()}`,
      tier: tier.name,
      player1: user?.name || 'You',
      player2: randomOpp,
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
    set({ currentMatch: newMatch, currentRound: 1, queueStatus: null, rounds: [], matchResult: null });
    return newMatch;
  },

  submitRoundResult: (playerScore, opponentScore) => {
    const { currentMatch, currentRound } = get();
    const socket = getSocket();
    const user = useAuthStore.getState().user;
    const myId = user?.id || 'u1';
    const myName = user?.name || 'You';

    set({ roundWaiting: true });

    if (socket && socket.connected) {
      socket.emit('submit_score', {
        matchId: currentMatch.matchId || currentMatch.id,
        roundNo: currentRound,
        userId: myId,
        score: playerScore,
        name: myName
      });
    }
  },

  clearMatch: () => {
    set({ currentMatch: null, currentRound: 0, rounds: [], matchResult: null, queueStatus: null, currentTier: null, matchmakingError: null, roundWaiting: false });
  },

  getRandomQuestion: (index) => {
    const q = get().questions;
    return q[index % q.length];
  },
}));

export default useMatchStore;
