import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { Card } from '../../shared/components/ui/index.js';
import RoundHeader from './components/RoundHeader.jsx';
import ScoreBoard from './components/ScoreBoard.jsx';
import WordDuel from './components/WordDuel.jsx';
import RoundTransition from './components/RoundTransition.jsx';
import useMatchStore from '../../shared/store/matchStore.js';

const ROUND_TIME = 30;
const TRANSITION_DURATION = 2500;

export default function GamePage() {
  const navigate = useNavigate();
  const { currentMatch, currentRound, rounds, matchResult, submitRoundResult, getRandomQuestion } = useMatchStore();

  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [answered, setAnswered] = useState(false);
  const [playerRoundScore, setPlayerRoundScore] = useState(0);
  const [opponentRoundScore, setOpponentRoundScore] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [lastRound, setLastRound] = useState(null);

  const question = getRandomQuestion((currentRound || 1) - 1);

  const handleAnswer = useCallback((isCorrect, selectedIndex) => {
    if (answered) return;
    const pScore = isCorrect ? 100 + timeLeft * 2 : 0;
    const oppScore = Math.floor(Math.random() * 80 + 60);
    setPlayerRoundScore(pScore);
    setOpponentRoundScore(oppScore);
    setAnswered(true);
  }, [answered, timeLeft]);

  const finishRound = useCallback(() => {
    const pScore = playerRoundScore;
    const oppScore = opponentRoundScore || Math.floor(Math.random() * 80 + 60);
    submitRoundResult(pScore, oppScore);
  }, [playerRoundScore, opponentRoundScore, submitRoundResult]);

  useEffect(() => {
    if (answered) {
      const t = setTimeout(finishRound, 1000);
      return () => clearTimeout(t);
    }
  }, [answered, finishRound]);

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
        setOpponentRoundScore(0);
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

  const playerWins = rounds.filter((r) => r.winner === 'Alex Storm').length;
  const opponentWins = rounds.filter((r) => r.winner === 'Maya Chen').length;

  return (
    <AppLayout>
      {showTransition && <RoundTransition round={lastRound} playerWins={playerWins} opponentWins={opponentWins} />}

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
            playerName="You"
            opponentName="Maya Chen"
            playerScore={playerRoundScore}
            opponentScore={answered ? opponentRoundScore : 0}
          />

          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              Play now. Highest score wins the round. Two round wins takes the match.
            </p>
            <WordDuel question={question} onAnswer={handleAnswer} answered={answered} />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
