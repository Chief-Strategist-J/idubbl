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

export default function GamePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentMatch, currentRound, rounds, matchResult, currentTier, submitRoundResult, getRandomQuestion, roundWaiting } = useMatchStore();

  const matchId = currentMatch?.matchId || currentMatch?.id;
  const opponentId = currentMatch?.players?.find(p => p?.toLowerCase() !== user?.id?.toLowerCase());
  const opponentName = currentMatch?.player2
    ?? (opponentId && currentMatch?.playerNames?.[opponentId])
    ?? 'Opponent';
  const matchChat = useMatchChat(matchId, user?.id, user?.name);

  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [answered, setAnswered] = useState(false);
  const [playerRoundScore, setPlayerRoundScore] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [lastRound, setLastRound] = useState(null);

  const gameType = currentTier?.gameType || 'word_duel';
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

  useEffect(() => {
    if (matchResult) {
      navigate('/result');
      return;
    }
    if (rounds.length > 0 && rounds.length < 3) {
      const lastR = rounds[rounds.length - 1];
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
  }, [rounds, matchResult, navigate]);

  if (!currentMatch) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No active match. <button className="nav-btn" onClick={() => navigate('/lobby')}>Join a tier</button>
        </div>
      </AppLayout>
    );
  }

  const playerWins = rounds.filter((r) => r.winner === (user?.name || 'You')).length;
  const opponentWins = rounds.filter((r) => r.winner === opponentName).length;

  return (
    <AppLayout>
      {showTransition && <RoundTransition round={lastRound} playerWins={playerWins} opponentWins={opponentWins} />}
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
            playerName={user?.name || 'You'}
            opponentName={opponentName}
            playerScore={playerRoundScore}
            opponentScore={answered && rounds[currentRound - 1] ? rounds[currentRound - 1].opponentScore : 0}
          />

          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              Play now. Highest score wins the round. Two round wins takes the match.
            </p>
            {gameType === 'word_duel'     && <WordDuel key={currentRound} question={question} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'math_duel'     && <MathDuel key={currentRound} question={mathQuestion} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'reaction_race' && <ReactionRace key={currentRound} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'lucky_wheel'   && <LuckyWheel key={currentRound} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'lucky_balls'   && <LuckyBalls key={currentRound} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'blackjack'     && <BlackjackDuel key={currentRound} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'holdem_poker'  && <HeadsUpPoker key={currentRound} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'baccarat'      && <BaccaratDuel key={currentRound} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'casino_war'    && <CasinoWar key={currentRound} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'red_dog'       && <RedDog key={currentRound} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'pai_gow'       && <PaiGowPoker key={currentRound} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'three_card'    && <ThreeCardPoker key={currentRound} onAnswer={handleAnswer} answered={answered} />}
            {gameType === 'video_poker'   && <VideoPoker key={currentRound} onAnswer={handleAnswer} answered={answered} />}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
