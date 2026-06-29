import { test } from 'node:test';
import assert from 'node:assert';
import { quizService } from '../services/quizService.js';
import { matchmakerService } from '../services/matchmakerService.js';
import { getDb } from '../services/db.js';

test('Quiz Service - Fetching and Shuffling Questions', async () => {
  const questions = await quizService.fetchQuestions(3);
  
  // Verify correct number of questions fetched
  assert.strictEqual(questions.length, 3);
  
  // Verify question structure
  questions.forEach(q => {
    assert.ok(q.question);
    assert.ok(Array.isArray(q.options));
    assert.strictEqual(q.options.length, 4);
    assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);
    
    // Verify correct answer is one of the options
    const correctOption = q.options[q.correctIndex];
    assert.ok(correctOption);
  });
});

test('Matchmaker - Secure Quiz Integration in Match Creation', async () => {
  const db = await getDb();
  const userId1 = 'quiz_user_1_' + Date.now();
  const userId2 = 'quiz_user_2_' + Date.now();
  const tier = 'Rookie';

  // Seed wallets
  await db.collection('wallets').updateOne(
    { userId: userId1 },
    { $set: { depositBalance: 20, winningsBalance: 5, lockedBalance: 0, idubbuBalance: 25000 } },
    { upsert: true }
  );
  await db.collection('wallets').updateOne(
    { userId: userId2 },
    { $set: { depositBalance: 30, winningsBalance: 0, lockedBalance: 0, idubbuBalance: 30000 } },
    { upsert: true }
  );

  // Queue user 1
  await matchmakerService.findMatch(userId1, tier, 'socket_1');

  // Match user 2 (creates match)
  const result = await matchmakerService.findMatch(userId2, tier, 'socket_2');
  
  assert.strictEqual(result.status, 'matched');
  assert.ok(result.match);
  
  // Verify match contains the quiz questions in database
  const matchInDb = await db.collection('matches').findOne({ matchId: result.match.matchId });
  assert.ok(matchInDb.questions);
  assert.strictEqual(matchInDb.questions.length, 5);
  
  // Verify questions in DB contain correctIndex (needed for backend validation)
  matchInDb.questions.forEach(q => {
    assert.ok(q.correctIndex !== undefined);
  });

  // Cleanup
  await db.collection('wallets').deleteMany({ userId: { $in: [userId1, userId2] } });
  await db.collection('transactions').deleteMany({ userId: { $in: [userId1, userId2] } });
  await db.collection('matches').deleteOne({ matchId: result.match.matchId });
});
