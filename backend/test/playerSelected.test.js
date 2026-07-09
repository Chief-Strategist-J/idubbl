import { test } from 'node:test';
import assert from 'node:assert';

test('Real-time matchmaking choice broadcast: player_selected is emitted immediately', () => {
  const activeScores = {};
  const emittedEvents = [];

  const mockIo = {
    to: (matchId) => ({
      emit: (event, data) => {
        emittedEvents.push({ matchId, event, data });
      }
    })
  };

  const handleScoreSubmission = ({ matchId, roundNo, userId, selectedIndex, timeLeft, name, players, playerNames }) => {
    let score = 100 + timeLeft * 2;
    let isCorrect = true;

    if (!activeScores[matchId]) {
      activeScores[matchId] = {};
    }
    if (!activeScores[matchId][roundNo]) {
      activeScores[matchId][roundNo] = [];
    }

    const roundSubmissions = activeScores[matchId][roundNo];
    if (!roundSubmissions.some(e => e.userId === userId)) {
      activeScores[matchId][roundNo].push({ userId, score, name, selectedIndex, isCorrect });
    }

    // Broadcast that this player selected an option
    mockIo.to(matchId).emit('player_selected', {
      matchId,
      roundNo,
      userId,
      name,
      selectedIndex
    });

    // If one of the players is 'system', simulate a system score submission automatically
    if (players && players.includes('system')) {
      const updatedSubmissions = activeScores[matchId][roundNo];
      if (!updatedSubmissions.some(e => e.userId === 'system')) {
        const botSelectedIndex = 2;
        const systemName = playerNames && playerNames['system'] ? playerNames['system'] : 'Opponent';

        activeScores[matchId][roundNo].push({
          userId: 'system',
          score: 110,
          name: systemName,
          selectedIndex: botSelectedIndex,
          isCorrect: true
        });

        // Broadcast bot's selection
        mockIo.to(matchId).emit('player_selected', {
          matchId,
          roundNo,
          userId: 'system',
          name: systemName,
          selectedIndex: botSelectedIndex
        });
      }
    }
  };

  const matchId = 'test_match_123';
  const roundNo = 1;

  // Test Case A: Real-time match with real players
  handleScoreSubmission({
    matchId,
    roundNo,
    userId: 'user_1',
    selectedIndex: 3,
    timeLeft: 15,
    name: 'Player 1',
    players: ['user_1', 'user_2'],
    playerNames: { user_1: 'Player 1', user_2: 'Player 2' }
  });

  // Verify that player_selected has been emitted for Player 1 immediately
  const eventsUser1 = emittedEvents.filter(e => e.event === 'player_selected');
  assert.strictEqual(eventsUser1.length, 1, 'player_selected event should be emitted immediately when Player 1 selects');
  assert.strictEqual(eventsUser1[0].data.userId, 'user_1');
  assert.strictEqual(eventsUser1[0].data.selectedIndex, 3);

  // Test Case B: Match with system bot
  emittedEvents.length = 0; // reset
  handleScoreSubmission({
    matchId,
    roundNo,
    userId: 'user_1',
    selectedIndex: 1,
    timeLeft: 12,
    name: 'Player 1',
    players: ['user_1', 'system'],
    playerNames: { user_1: 'Player 1', system: 'Bot opponent' }
  });

  // Verify that player_selected has been emitted for BOTH Player 1 and the system bot
  const eventsSystem = emittedEvents.filter(e => e.event === 'player_selected');
  assert.strictEqual(eventsSystem.length, 2, 'Two player_selected events should be emitted (Player 1 + system bot)');
  assert.strictEqual(eventsSystem[0].data.userId, 'user_1');
  assert.strictEqual(eventsSystem[1].data.userId, 'system');
  assert.strictEqual(eventsSystem[1].data.selectedIndex, 2);

  console.log('✓ Real-time player selection broadcast test passed successfully!');
});
