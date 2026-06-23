import React, { useState } from 'react';
import GameCard from './GameCard.jsx';
import { createShuffledDeck, videoPokerRank } from './cardUtils.js';

const HAND_PAY = { 'Royal Flush': '800:1', 'Straight Flush': '50:1', 'Four of a Kind': '25:1', 'Full House': '9:1', 'Flush': '6:1', 'Straight': '4:1', 'Three of a Kind': '3:1', 'Two Pair': '2:1', 'One Pair': '1:1' };

export default function VideoPoker({ onAnswer, answered }) {
  const [deck] = useState(createShuffledDeck());
  const [hand, setHand] = useState(deck.slice(0, 5));
  const [held, setHeld] = useState([false, false, false, false, false]);
  const [drawn, setDrawn] = useState(false);
  const [result, setResult] = useState('');

  const toggleHold = (i) => {
    if (drawn || answered) return;
    setHeld(prev => { const h = [...prev]; h[i] = !h[i]; return h; });
  };

  const draw = () => {
    if (drawn || answered) return;
    let deckIdx = 5;
    const newHand = hand.map((c, i) => held[i] ? c : deck[deckIdx++]);
    setHand(newHand);
    setDrawn(true);

    const eval_ = videoPokerRank(newHand);
    const win = eval_.rank >= 0.5;
    const payLabel = HAND_PAY[eval_.name];
    setResult(win ? `${eval_.name}${payLabel ? ' — pays ' + payLabel : ''}` : `${eval_.name} — no payout`);
    onAnswer(win, held.filter(Boolean).length);
  };

  const currentEval = videoPokerRank(hand);

  return (
    <div className="casino-game">
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
        Tap cards to HOLD, then DRAW replacements
      </p>

      <div className="casino-hand" style={{ justifyContent: 'center', gap: '0.4rem', flexWrap: 'nowrap' }}>
        {hand.map((c, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <GameCard card={c} selected={held[i]} onClick={() => toggleHold(i)} />
            <span style={{ fontSize: '0.6rem', color: held[i] ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, letterSpacing: 1, transition: 'color 0.2s' }}>
              {held[i] ? 'HELD' : 'tap'}
            </span>
          </div>
        ))}
      </div>

      {!drawn && (
        <p style={{ textAlign: 'center', color: 'var(--primary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          {currentEval.name}
        </p>
      )}

      {!drawn && !answered && (
        <div className="casino-actions" style={{ marginTop: '1.25rem' }}>
          <button className="casino-btn casino-btn-primary" style={{ flex: 1 }} onClick={draw}>DRAW</button>
        </div>
      )}

      {result && <p className={`casino-result ${result.includes('no payout') ? 'result-lose' : 'result-win'}`}>{result}</p>}
    </div>
  );
}
