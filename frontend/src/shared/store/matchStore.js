import { create } from 'zustand';
import { MOCK_MATCHES, MOCK_TIERS, WORD_DUEL_QUESTIONS } from '../mock/index.js';

let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
  apiBase = `https://${apiBase}`;
}
const ADMIN_BASE_URL = `${apiBase}/api/admin`;

const useMatchStore = create((set, get) => ({
  matches: MOCK_MATCHES,
  tiers: MOCK_TIERS,
  queueStatus: null, // null | 'searching' | 'matched' | 'starting'
  currentTier: null,
  currentMatch: null,
  currentRound: 0,
  rounds: [],
  matchResult: null,
  questions: WORD_DUEL_QUESTIONS,
  loading: false,

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

  joinQueue: (tierId) => {
    const tier = get().tiers.find((t) => t.id === tierId);
    set({ queueStatus: 'searching', currentTier: tier, currentMatch: null, rounds: [], matchResult: null });
  },

  leaveQueue: () => {
    set({ queueStatus: null, currentTier: null });
  },

  simulateMatch: (matchId) => {
    const match = get().matches.find((m) => m.id === matchId);
    set({ currentMatch: match, currentRound: 1, queueStatus: 'starting', rounds: [] });
  },

  startNewMatch: (tier) => {
    const newMatch = {
      id: `m${Date.now()}`,
      tier: tier.name,
      player1: 'Alex Storm',
      player2: 'Maya Chen',
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
    const { currentRound, rounds, currentMatch } = get();
    const roundWinner = playerScore > opponentScore ? 'Alex Storm' : 'Maya Chen';
    const newRound = {
      roundNo: currentRound,
      winner: roundWinner,
      score: `${playerScore}-${opponentScore}`,
      playerScore,
      opponentScore,
    };
    const updatedRounds = [...rounds, newRound];
    const playerWins = updatedRounds.filter((r) => r.winner === 'Alex Storm').length;
    const opponentWins = updatedRounds.filter((r) => r.winner === 'Maya Chen').length;

    if (playerWins === 2 || opponentWins === 2 || updatedRounds.length === 3) {
      const matchWinner = playerWins > opponentWins ? 'Alex Storm' : 'Maya Chen';
      const isWinner = matchWinner === 'Alex Storm';
      const result = {
        winner: matchWinner,
        isWinner,
        rounds: updatedRounds,
        prize: isWinner ? currentMatch.prize : 0,
        rake: currentMatch.rake,
        entryFee: get().tiers.find((t) => t.name === currentMatch.tier)?.entryFee || 0,
        refId: currentMatch.refId,
        settledAt: new Date().toISOString(),
      };
      set({ rounds: updatedRounds, matchResult: result, currentMatch: { ...currentMatch, status: 'completed', winner: matchWinner } });
    } else {
      set({ rounds: updatedRounds, currentRound: currentRound + 1 });
    }
  },

  clearMatch: () => {
    set({ currentMatch: null, currentRound: 0, rounds: [], matchResult: null, queueStatus: null, currentTier: null });
  },

  getRandomQuestion: (index) => {
    const q = get().questions;
    return q[index % q.length];
  },
}));

export default useMatchStore;
