import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import useAuthStore from '../../shared/store/authStore.js';
import { useMatchChat } from '../../shared/hooks/useMatchChat.js';
import MatchChatWidget from './components/MatchChatWidget.jsx';
import { Card } from '../../shared/components/ui/index.js';
import RoundHeader from './components/RoundHeader.jsx';
import ScoreBoard from './components/ScoreBoard.jsx';
import WordDuel from './components/WordDuel.jsx';
import MathDuel from './components/MathDuel.jsx';
import ReactionRace from './components/ReactionRace.jsx';
import LuckyWheel from './components/LuckyWheel.jsx';
import LuckyBalls from './components/LuckyBalls.jsx';
import BlackjackDuel from './components/BlackjackDuel.jsx';
import HeadsUpPoker from './components/HeadsUpPoker.jsx';
import BaccaratDuel from './components/BaccaratDuel.jsx';
import CasinoWar from './components/CasinoWar.jsx';
import RedDog from './components/RedDog.jsx';
import PaiGowPoker from './components/PaiGowPoker.jsx';
import ThreeCardPoker from './components/ThreeCardPoker.jsx';
import VideoPoker from './components/VideoPoker.jsx';
import RoundTransition from './components/RoundTransition.jsx';
import useMatchStore from '../../shared/store/matchStore.js';
import { MATH_DUEL_QUESTIONS } from '../../shared/mock/index.js';

const ROUND_TIME = 20;
const TRANSITION_DURATION = 2500;

const GAME_REGISTRY = {
  word_duel:     WordDuel,
  math_duel:     MathDuel,
  reaction_race: ReactionRace,
  lucky_wheel:   LuckyWheel,
  lucky_balls:   LuckyBalls,
  blackjack:     BlackjackDuel,
  holdem_poker:  HeadsUpPoker,
  baccarat:      BaccaratDuel,
  casino_war:    CasinoWar,
  red_dog:       RedDog,
  pai_gow:       PaiGowPoker,
  three_card:    ThreeCardPoker,
  video_poker:   VideoPoker,
};

export default function GamePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentMatch, currentRound, rounds, matchResult, currentTier, submitRoundResult, getRandomQuestion, roundWaiting } = useMatchStore();

  const matchId = currentMatch?.matchId ?? currentMatch?.id;
  const opponentId = currentMatch?.players?.find(p => p?.toLowerCase() !== user?.id?.toLowerCase());
  const opponentName = currentMatch?.player2
    ?? (opponentId ? currentMatch?.playerNames?.[opponentId] : null)
    ?? 'Opponent';
  const matchChat = useMatchChat(matchId, user?.id, user?.name);

  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [answered, setAnswered] = useState(false);
  const [playerRoundScore, setPlayerRoundScore] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [lastRound, setLastRound] = useState(null);

  const gameType = currentTier?.gameType ?? 'word_duel';
  const question = getRandomQuestion((currentRound || 1) - 1);
  const mathQuestion = MATH_DUEL_QUESTIONS[((currentRound || 1) - 1) % MATH_DUEL_QUESTIONS.length];

  const handleAnswer = useCallback((isCorrect, selectedIndex) => {
    if (answered) return;
    const pScore = isCorrect ? 100 + timeLeft * 2 : 0;
    setPlayerRoundScore(pScore);
    setAnswered(true);
    submitRoundResult(pScore);
  }, [answered, timeLeft, submitRoundResult]);

  useEffect(() => {
    if (answered) return;
    if (timeLeft <= 0) { handleAnswer(false, -1); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, answered, handleAnswer]);

  // Navigate to result when match is decided
  useEffect(() => {
    if (matchResult) {
      navigate('/result');
    }
  }, [matchResult, navigate]);

  // Show round transition overlay between rounds
  useEffect(() => {
    const safeRounds = rounds ?? [];
    if (safeRounds.length > 0 && safeRounds.length < 3) {
      const lastR = safeRounds[safeRounds.length - 1];
      setLastRound(lastR);
      setShowTransition(true);
      const t = setTimeout(() => {
        setShowTransition(false);
        setLastRound(null);
        setTimeLeft(ROUND_TIME);
        setAnswered(false);
        setPlayerRoundScore(0);
      }, TRANSITION_DURATION);
      return () => clearTimeout(t);
    }
  }, [rounds?.length]); // eslint-disable-line

  if (!currentMatch) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No active match. <button className="nav-btn" onClick={() => navigate('/lobby')}>Join a tier</button>
        </div>
      </AppLayout>
    );
  }

  const safeRounds = rounds ?? [];
  const playerName = user?.name ?? 'You';
  const playerWins = safeRounds.filter((r) => r.winner === playerName).length;
  const opponentWins = safeRounds.filter((r) => r.winner === opponentName).length;

  const GameComponent = GAME_REGISTRY[gameType] ?? WordDuel;
  const gameProps = { key: currentRound, onAnswer: handleAnswer, answered };
  if (gameType === 'word_duel') gameProps.question = question;
  if (gameType === 'math_duel') gameProps.question = mathQuestion;

  return (
    <AppLayout>
      {showTransition && <RoundTransition round={lastRound} playerWins={playerWins} opponentWins={opponentWins} />}

      {roundWaiting && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(10,13,18,0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem'
        }}>
          <div className="spinner" style={{ width: '50px', height: '50px', border: '4px solid var(--border)', borderTop: '4px solid var(--accent-green)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Waiting for Opponent...</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Your score was submitted. The round completes when both players finish.</p>
        </div>
      )}

      <MatchChatWidget
        messages={matchChat.messages}
        sendMessage={matchChat.sendMessage}
        isOpen={matchChat.isOpen}
        toggle={matchChat.toggle}
        unread={matchChat.unread}
        userId={user?.id}
        opponentName={opponentName}
      />

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Card>
          <RoundHeader
            roundNo={currentRound}
            timeLeft={timeLeft}
            maxTime={ROUND_TIME}
            playerWins={playerWins}
            opponentWins={opponentWins}
          />

          <ScoreBoard
            playerName={playerName}
            opponentName={opponentName}
            playerScore={playerRoundScore}
            opponentScore={answered && safeRounds[currentRound - 1] ? safeRounds[currentRound - 1].opponentScore : 0}
          />

          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              Play now. Highest score wins the round. Two round wins takes the match.
            </p>
            <GameComponent {...gameProps} />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
