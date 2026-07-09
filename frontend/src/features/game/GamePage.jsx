import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import useAuthStore from '../../shared/store/authStore.js';
import { useMatchChat } from '../../shared/hooks/useMatchChat.js';
import usePlatformStore from '../../shared/store/platformStore.js';
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
import useWalletStore from '../../shared/store/walletStore.js';
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

// Casino/card games manage their own win/loss logic internally.
// They call onAnswer(didWin, choiceIndex) — the first arg is a boolean.
// These games should NOT use question banks or a countdown timer.
const CASINO_GAMES = new Set([
  'lucky_wheel', 'lucky_balls', 'blackjack', 'holdem_poker',
  'baccarat', 'casino_war', 'red_dog', 'pai_gow', 'three_card', 'video_poker',
]);

export default function GamePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentMatch, currentRound, rounds, matchResult, currentTier, submitRoundResult, getRandomQuestion, roundWaiting, roundSelections } = useMatchStore();

  const { chatEnabled } = usePlatformStore();
  const { fetchWalletData } = useWalletStore();

  // Sync balance once on game start — backend deducted entry fee when match was found
  useEffect(() => { fetchWalletData(user?.id); }, []); // eslint-disable-line

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

  const gameType = currentTier?.gameType ?? currentMatch?.gameType ?? 'word_duel';
  const isCasinoGame = CASINO_GAMES.has(gameType);
  const questions = currentMatch?.questions || [];
  const question = questions[(currentRound || 1) - 1] || null;

  const opponentSelection = opponentId ? roundSelections[opponentId.toLowerCase()] : null;
  const mySelection = user?.id ? roundSelections[user.id.toLowerCase()] : null;

  const handleAnswer = useCallback((selectedIndexOrDidWin) => {
    if (answered) return;

    if (isCasinoGame) {
      // Casino games pass a boolean (didWin) as first argument.
      // Convert it to a numeric score and submit directly — no question bank used.
      const didWin = selectedIndexOrDidWin === true;
      const casinoScore = didWin ? 140 : 0; // Fixed score: win=140, loss=0
      setPlayerRoundScore(casinoScore);
      setAnswered(true);
      // Submit with a sentinel index that the backend treats as a casino result
      submitRoundResult(didWin ? 1 : 0, timeLeft);
    } else {
      // Quiz games: selectedIndex is a number
      const selectedIndex = selectedIndexOrDidWin;
      // Estimate score locally for fast feedback, but server is authoritative
      const estScore = selectedIndex !== -1 ? 100 + timeLeft * 2 : 0;
      setPlayerRoundScore(estScore);
      setAnswered(true);
      submitRoundResult(selectedIndex, timeLeft);
    }
  }, [answered, timeLeft, submitRoundResult, isCasinoGame]);

  useEffect(() => {
    if (isCasinoGame || answered) return;
    if (timeLeft <= 0) { handleAnswer(-1); return; }
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
  const gameProps = {
    onAnswer: handleAnswer,
    answered,
    question,
    correctIndex: safeRounds[currentRound - 1]?.correctIndex,
    opponentSelection,
    opponentName,
    mySelection
  };

  const opponentHasPlayed = opponentSelection !== null && opponentSelection !== undefined;

  return (
    <AppLayout>
      {showTransition && (
        <RoundTransition
          round={lastRound}
          playerWins={playerWins}
          opponentWins={opponentWins}
          question={questions[lastRound.roundNo - 1]}
          opponentName={opponentName}
        />
      )}

      {chatEnabled && (
        <MatchChatWidget
          messages={matchChat.messages}
          sendMessage={matchChat.sendMessage}
          isOpen={matchChat.isOpen}
          toggle={matchChat.toggle}
          unread={matchChat.unread}
          userId={user?.id}
          opponentName={opponentName}
        />
      )}

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
            playerScore={safeRounds[currentRound - 1] ? safeRounds[currentRound - 1].playerScore : playerRoundScore}
            opponentScore={safeRounds[currentRound - 1] ? safeRounds[currentRound - 1].opponentScore : 0}
          />

          {opponentHasPlayed && !answered && (
            <div style={{
              margin: '0.75rem 1.25rem 0 1.25rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 500
            }}>
              <span>🔔</span>
              <span>{opponentName} has selected an answer! Make your choice.</span>
            </div>
          )}

          {roundWaiting && (
            <div style={{
              margin: '0.75rem 1.25rem 0 1.25rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              color: 'var(--accent-cyan)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 500
            }}>
              <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid var(--border)', borderTop: '2px solid var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
              <span>Waiting for {opponentName} to answer...</span>
            </div>
          )}

          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              Play now. Highest score wins the round. Two round wins takes the match.
            </p>
            <GameComponent key={currentRound} {...gameProps} />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
