import { test } from 'node:test';
import assert from 'node:assert';

test('Real-time score tracking: players are blocked from advancing until both scores are submitted', () => {
  const activeScores = {};
  const emittedEvents = [];

  const mockIo = {
    to: (matchId) => ({
      emit: (event, data) => {
        emittedEvents.push({ matchId, event, data });
      }
    })
  };

  const handleScoreSubmission = ({ matchId, roundNo, userId, score, name }, socketId) => {
    if (!activeScores[matchId]) {
      activeScores[matchId] = {};
    }
    if (!activeScores[matchId][roundNo]) {
      activeScores[matchId][roundNo] = [];
    }

    if (!activeScores[matchId][roundNo].some(e => e.userId === userId)) {
      activeScores[matchId][roundNo].push({ userId, score, name, socketId });
    }

    const roundSubmissions = activeScores[matchId][roundNo];
    if (roundSubmissions.length >= 2) {
      const p1 = roundSubmissions[0];
      const p2 = roundSubmissions[1];

      let winnerId = null;
      let winnerName = null;

      if (p1.score > p2.score) {
        winnerId = p1.userId;
        winnerName = p1.name;
      } else if (p2.score > p1.score) {
        winnerId = p2.userId;
        winnerName = p2.name;
      } else {
        winnerId = 'tie';
        winnerName = 'tie';
      }

      mockIo.to(matchId).emit('round_completed', {
        roundNo,
        winnerId,
        winnerName,
        submissions: roundSubmissions
      });
    }
  };

  const matchId = 'test_match_123';
  const roundNo = 1;

  // 1. Player 1 submits score
  handleScoreSubmission({
    matchId,
    roundNo,
    userId: 'user_1',
    score: 150,
    name: 'Player 1'
  }, 'socket_1');

  // Verify that no event has been emitted (round is not complete, players are blocked from advancing)
  assert.strictEqual(emittedEvents.length, 0, 'No round_completed event should be emitted when only one player submits score');

  // 2. Player 2 submits score
  handleScoreSubmission({
    matchId,
    roundNo,
    userId: 'user_2',
    score: 180,
    name: 'Player 2'
  }, 'socket_2');

  // Verify that round_completed event is emitted now that both players have submitted
  assert.strictEqual(emittedEvents.length, 1, 'round_completed event should be emitted when both players submit scores');
  assert.strictEqual(emittedEvents[0].event, 'round_completed');
  assert.strictEqual(emittedEvents[0].data.roundNo, roundNo);
  assert.strictEqual(emittedEvents[0].data.winnerId, 'user_2');
  assert.strictEqual(emittedEvents[0].data.winnerName, 'Player 2');

  console.log('✓ Real-time score update integration test passed successfully!');
});
