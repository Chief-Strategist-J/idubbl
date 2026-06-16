import React, { useState } from 'react';
import GameCard from './GameCard.jsx';
import { createShuffledDeck, evaluateThreeCard, rankOrder } from './cardUtils.js';

const PAYOUTS = { 5: '40:1 Str.Flush', 4: '30:1 Three of Kind', 3: '6:1 Straight', 2: '3:1 Flush', 1: '1:1 Pair', 0: 'Lose' };

export default function ThreeCardPoker({ onAnswer, answered }) {
  const [deck] = useState(createShuffledDeck());
  const [playerCards] = useState(deck.slice(0, 3));
  const [dealerCards] = useState(deck.slice(3, 6));
  const [phase, setPhase] = useState('decide'); // decide | showdown
  const [result, setResult] = useState('');

  const playerHand = evaluateThreeCard(playerCards);

  const decide = (play) => {
    if (!play) {
      setResult('Folded — ante lost.');
      setPhase('showdown');
      onAnswer(false, 0);
      return;
    }
    const dealerHand = evaluateThreeCard(dealerCards);
    // Dealer qualifies with Queen-high or better (not pair — Queen-high)
    const dealerHighCard = Math.max(...dealerCards.map(c => rankOrder(c.rank)));
    const qualify = dealerHand.rank >= 1 || dealerHighCard >= 12;
    // Ties go to dealer (house advantage); need strict win
    const win = playerHand.rank > dealerHand.rank;
    const tie = playerHand.rank === dealerHand.rank;

    if (!qualify) {
      setResult(`Dealer doesn't qualify (${dealerHand.name}). Ante pays 1:1!`);
    } else if (win) {
      setResult(`You win! ${playerHand.name} beats dealer's ${dealerHand.name}`);
    } else if (tie) {
      setResult(`Tie — dealer takes play bet (${dealerHand.name}).`);
    } else {
      setResult(`Dealer wins with ${dealerHand.name} vs your ${playerHand.name}`);
    }
    setPhase('showdown');
    onAnswer(!qualify || win, 1);
  };

  return (
    <div className="casino-game">
      <div className="casino-game-area">
        {phase === 'showdown' && (
          <>
            <div className="casino-hand-label">Dealer</div>
            <div className="casino-hand">{dealerCards.map((c, i) => <GameCard key={i} card={c} small />)}</div>
            <div style={{ margin: '0.75rem 0 0.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{evaluateThreeCard(dealerCards).name}</div>
          </>
        )}
        <div className="casino-hand-label" style={{ marginTop: phase === 'showdown' ? '1rem' : 0 }}>Your Hand</div>
        <div className="casino-hand">{playerCards.map((c, i) => <GameCard key={i} card={c} />)}</div>
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <span style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, padding: '0.3rem 0.8rem', fontSize: '0.8rem', color: '#c084fc' }}>
            {playerHand.name} — {PAYOUTS[Math.min(playerHand.rank, 5)]}
          </span>
        </div>
      </div>

      {phase === 'decide' && !answered && (
        <div className="casino-actions" style={{ marginTop: '1rem' }}>
          <button className="casino-btn casino-btn-secondary" onClick={() => decide(false)}>FOLD</button>
          <button className="casino-btn casino-btn-primary" onClick={() => decide(true)}>PLAY (2× bet)</button>
        </div>
      )}

      {result && <p className={`casino-result ${result.startsWith('You win') || result.includes('pays') ? 'result-win' : result.startsWith('Tie') ? 'result-push' : 'result-lose'}`}>{result}</p>}
    </div>
  );
}
