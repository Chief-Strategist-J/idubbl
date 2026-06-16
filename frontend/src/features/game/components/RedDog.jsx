import React, { useState } from 'react';
import GameCard from './GameCard.jsx';
import { createShuffledDeck, rankOrder } from './cardUtils.js';

export default function RedDog({ onAnswer, answered }) {
  const [deck] = useState(createShuffledDeck());
  const [phase, setPhase] = useState('bet'); // bet | reveal
  const [raised, setRaised] = useState(false);
  const [middleCard, setMiddleCard] = useState(null);
  const [result, setResult] = useState('');

  const card1 = deck[0];
  const card2 = deck[1];
  const r1 = rankOrder(card1.rank);
  const r2 = rankOrder(card2.rank);
  const lo = Math.min(r1, r2);
  const hi = Math.max(r1, r2);
  const spread = hi - lo - 1;

  const decide = (raise) => {
    setRaised(raise);
    const mid = deck[2];
    const midRank = rankOrder(mid.rank);
    const inBetween = midRank > lo && midRank < hi;
    setMiddleCard(mid);

    if (spread <= 0) {
      // Pair or adjacent — push or special
      setResult(r1 === r2 ? 'Same ranks — push! Bet returned.' : 'Adjacent cards — no spread. Push!');
      setPhase('reveal');
      onAnswer(false, raise ? 1 : 0);
      return;
    }

    const win = inBetween;
    setResult(win
      ? `${mid.rank} falls in spread! You ${raise ? 'raised and ' : ''}WIN!`
      : `${mid.rank} is outside the spread. You lose.`);
    setPhase('reveal');
    onAnswer(win, raise ? 1 : 0);
  };

  return (
    <div className="casino-game">
      <div className="casino-game-area">
        <div className="casino-hand-label" style={{ textAlign: 'center' }}>Spread cards</div>
        <div className="casino-hand" style={{ justifyContent: 'center', gap: '1.5rem' }}>
          <GameCard card={card1} />
          {phase === 'reveal' && middleCard
            ? <GameCard card={middleCard} />
            : <div className="red-dog-gap">{spread > 0 ? `Spread: ${spread}` : spread === 0 ? 'Adjacent' : 'Pair'}</div>}
          <GameCard card={card2} />
        </div>

        {phase === 'bet' && spread > 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: '1rem 0' }}>
            Will the next card fall between these two?
          </p>
        )}
        {phase === 'bet' && spread <= 0 && (
          <p style={{ textAlign: 'center', color: '#fbbf24', fontSize: '0.85rem', margin: '1rem 0' }}>
            No spread — force reveal
          </p>
        )}
      </div>

      {phase === 'bet' && !answered && (
        <div className="casino-actions">
          <button className="casino-btn casino-btn-secondary" onClick={() => decide(false)}>STAND (1×)</button>
          <button className="casino-btn casino-btn-primary" onClick={() => decide(true)}>RAISE (2×)</button>
        </div>
      )}

      {result && <p className={`casino-result ${result.includes('WIN') || result.includes('push') ? 'result-win' : 'result-lose'}`}>{result}</p>}
    </div>
  );
}
