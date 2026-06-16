import React, { useState } from 'react';
import GameCard from './GameCard.jsx';
import { createShuffledDeck, evaluateHand, rankOrder } from './cardUtils.js';

// Score a 2-card low hand: pair beats any non-pair; otherwise compare high card
function lowHandScore(low) {
  const r0 = rankOrder(low[0].rank);
  const r1 = rankOrder(low[1].rank);
  return r0 === r1 ? 100 + r0 : Math.max(r0, r1);
}

// Best 5-card + 2-card split: primary = strongest high hand, secondary = strongest low hand
function suggestSplit(cards) {
  let bestSplit = null;
  let bestScore = -1;
  for (let i = 0; i < cards.length - 1; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const low = [cards[i], cards[j]];
      const high = cards.filter((_, idx) => idx !== i && idx !== j);
      const highEval = evaluateHand(high);
      // Weight 1000× high hand rank so it always dominates low hand score
      const score = highEval.rank * 1000 + lowHandScore(low);
      if (score > bestScore) { bestScore = score; bestSplit = { low, high, highEval }; }
    }
  }
  return bestSplit;
}

export default function PaiGowPoker({ onAnswer, answered }) {
  const [deck] = useState(createShuffledDeck());
  const playerCards = deck.slice(0, 7);
  const dealerCards = deck.slice(7, 14);

  const [lowHand, setLowHand] = useState([]);
  const [highHand, setHighHand] = useState([]);
  const [remaining, setRemaining] = useState(playerCards);
  const [phase, setPhase] = useState('arrange'); // arrange | showdown
  const [result, setResult] = useState('');

  const suggestion = suggestSplit(playerCards);

  const autoSet = () => {
    setLowHand(suggestion.low);
    setHighHand(suggestion.high);
    setRemaining([]);
  };

  const toggleCard = (card, from) => {
    if (phase !== 'arrange' || answered) return;
    if (from === 'remaining') {
      if (lowHand.length < 2) setLowHand(prev => [...prev, card]);
      else if (highHand.length < 5) setHighHand(prev => [...prev, card]);
      setRemaining(prev => prev.filter(c => c !== card));
    } else if (from === 'low') {
      setLowHand(prev => prev.filter(c => c !== card));
      setRemaining(prev => [...prev, card]);
    } else {
      setHighHand(prev => prev.filter(c => c !== card));
      setRemaining(prev => [...prev, card]);
    }
  };

  const showdown = () => {
    const useLow = lowHand.length === 2 ? lowHand : suggestion.low;
    const useHigh = highHand.length === 5 ? highHand : suggestion.high;
    const dSplit = suggestSplit(dealerCards);

    const myHighEval = evaluateHand(useHigh);
    const myLowScore = lowHandScore(useLow);
    const dHighEval = dSplit.highEval;
    const dLowScore = lowHandScore(dSplit.low);

    const winHigh = myHighEval.rank > dHighEval.rank;
    const winLow = myLowScore > dLowScore;

    if (winHigh && winLow) {
      setResult(`You win both hands! ${myHighEval.name} high hand.`);
      onAnswer(true, 1);
    } else if (!winHigh && !winLow) {
      setResult(`Dealer wins both hands. ${dHighEval.name} beats ${myHighEval.name}.`);
      onAnswer(false, 0);
    } else {
      setResult(`Split — each wins one hand. Push!`);
      onAnswer(false, 2);
    }
    setLowHand(useLow);
    setHighHand(useHigh);
    setPhase('showdown');
  };

  return (
    <div className="casino-game">
      <div className="casino-game-area">
        {phase === 'showdown' && (
          <>
            <div className="casino-hand-label">Dealer's Hands</div>
            <div className="casino-hand" style={{ gap: '0.25rem' }}>
              {suggestSplit(dealerCards).high.map((c, i) => <GameCard key={i} card={c} small />)}
              <div style={{ width: 8 }} />
              {suggestSplit(dealerCards).low.map((c, i) => <GameCard key={i} card={c} small />)}
            </div>
          </>
        )}

        <div className="casino-hand-label" style={{ marginTop: phase === 'showdown' ? '0.75rem' : 0 }}>
          5-Card High Hand {highHand.length > 0 && <span style={{ color: '#c084fc' }}>({evaluateHand(highHand.length === 5 ? highHand : [...highHand, ...Array(5 - highHand.length).fill(null)].filter(Boolean)).name})</span>}
        </div>
        <div className="casino-hand" style={{ minHeight: 66 }}>
          {highHand.map((c, i) => <GameCard key={i} card={c} small onClick={() => toggleCard(c, 'high')} />)}
          {Array(5 - highHand.length).fill(null).map((_, i) => (
            <div key={i} className="pai-gow-slot">5H</div>
          ))}
        </div>

        <div className="casino-hand-label">2-Card Low Hand</div>
        <div className="casino-hand" style={{ minHeight: 66 }}>
          {lowHand.map((c, i) => <GameCard key={i} card={c} small onClick={() => toggleCard(c, 'low')} />)}
          {Array(2 - lowHand.length).fill(null).map((_, i) => (
            <div key={i} className="pai-gow-slot">2L</div>
          ))}
        </div>

        {phase === 'arrange' && remaining.length > 0 && (
          <>
            <div className="casino-hand-label">Your Cards — tap to place</div>
            <div className="casino-hand" style={{ flexWrap: 'wrap' }}>
              {remaining.map((c, i) => <GameCard key={i} card={c} small onClick={() => toggleCard(c, 'remaining')} />)}
            </div>
          </>
        )}
      </div>

      {result && <p className={`casino-result ${result.includes('win both') ? 'result-win' : result.includes('Split') ? 'result-push' : 'result-lose'}`}>{result}</p>}

      {phase === 'arrange' && !answered && (
        <div className="casino-actions" style={{ marginTop: '0.75rem' }}>
          <button className="casino-btn casino-btn-secondary" onClick={autoSet}>AUTO-SET</button>
          <button className="casino-btn casino-btn-primary" disabled={highHand.length !== 5 || lowHand.length !== 2} onClick={showdown}>SET HANDS</button>
        </div>
      )}
    </div>
  );
}
