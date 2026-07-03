import { describe, it, expect } from 'vitest';

// Simulate the filter logic used in RecentMatches
function filterUserRecentMatches(matches, currentUserId, currentUserName) {
  return matches
    .filter((m) => {
      if (m.status !== 'completed') return false;
      const isP1 = m.player1 === currentUserName || m.player1 === 'You' || m.player1Id === currentUserId || (m.players && m.players[0] === currentUserId);
      const isP2 = m.player2 === currentUserName || m.player2 === 'You' || m.player2Id === currentUserId || (m.players && m.players[1] === currentUserId);
      return isP1 || isP2;
    })
    .map((m) => {
      let opponent = 'Opponent';
      const entryFee = m.entryFee || 5;
      
      if (m.players && m.playerNames) {
        const oppId = m.players.find(pId => pId !== currentUserId);
        opponent = m.playerNames[oppId] || 'Opponent';
      } else {
        const isP1 = m.player1 === currentUserName || m.player1 === 'You';
        opponent = isP1 ? m.player2 : m.player1;
      }

      return {
        ...m,
        opponent,
        entryFee,
      };
    });
}

// Simulate the statistics calculation in DashboardPage
function computeWinLossStats(matches, currentUserId, currentUserName) {
  const completedMatches = matches.filter((m) => {
    if (m.status !== 'completed') return false;
    const isP1 = m.player1 === currentUserName || m.player1 === 'You' || m.player1Id === currentUserId || (m.players && m.players[0] === currentUserId);
    const isP2 = m.player2 === currentUserName || m.player2 === 'You' || m.player2Id === currentUserId || (m.players && m.players[1] === currentUserId);
    return isP1 || isP2;
  });
  
  const wins = completedMatches.filter((m) => m.winnerId === currentUserId || m.winner === currentUserId || m.winner === currentUserName || m.winner === 'You').length;
  const losses = completedMatches.length - wins;
  const winRate = completedMatches.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0;

  return { completedCount: completedMatches.length, wins, losses, winRate };
}

describe('Recent Matches & Activity Filters', () => {
  const mockMatches = [
    { id: 'm1', tier: 'Rookie', player1: 'Alex Storm', player2: 'Maya Chen', status: 'completed', winner: 'Alex Storm', winnerId: 'u1' },
    { id: 'm2', tier: 'Pro', player1: 'Alex Storm', player2: 'Jordan Wick', status: 'completed', winner: 'Jordan Wick', winnerId: 'u3' },
    { id: 'm3', tier: 'Rookie', player1: 'Maya Chen', player2: 'Jordan Wick', status: 'completed', winner: 'Maya Chen', winnerId: 'u2' }, // Other person's match
    { id: 'm4', tier: 'Elite', players: ['u1', 'u5'], playerNames: { u1: 'Alex Storm', u5: 'Nova' }, status: 'completed', winner: 'u1', winnerId: 'u1' }, // DB schema match
    { id: 'm5', tier: 'Micro', player1: 'Alex Storm', player2: 'Jordan Wick', status: 'active', winner: null, winnerId: null } // Active match
  ];

  it('should filter matches to only show current user matches and exclude other people matches', () => {
    const alexMatches = filterUserRecentMatches(mockMatches, 'u1', 'Alex Storm');
    
    // Should contain:
    // m1: Alex Storm vs Maya Chen (completed)
    // m2: Alex Storm vs Jordan Wick (completed)
    // m4: Alex Storm vs Nova (completed)
    // Should NOT contain:
    // m3: Maya Chen vs Jordan Wick (not involving Alex Storm)
    // m5: Alex Storm vs Jordan Wick (active, not completed)
    expect(alexMatches.length).toBe(3);
    expect(alexMatches.map(m => m.id)).toEqual(['m1', 'm2', 'm4']);
  });

  it('should resolve the correct opponent names for both legacy and db schemas', () => {
    const alexMatches = filterUserRecentMatches(mockMatches, 'u1', 'Alex Storm');
    
    expect(alexMatches[0].opponent).toBe('Maya Chen');
    expect(alexMatches[1].opponent).toBe('Jordan Wick');
    expect(alexMatches[2].opponent).toBe('Nova');
  });

  it('should calculate win/loss summary statistics accurately for the current user only', () => {
    const stats = computeWinLossStats(mockMatches, 'u1', 'Alex Storm');
    
    // Completed matches involving Alex Storm: m1 (won), m2 (lost), m4 (won). Total completed = 3. Wins = 2. Losses = 1.
    expect(stats.completedCount).toBe(3);
    expect(stats.wins).toBe(2);
    expect(stats.losses).toBe(1);
    expect(stats.winRate).toBe(67);
  });
});
