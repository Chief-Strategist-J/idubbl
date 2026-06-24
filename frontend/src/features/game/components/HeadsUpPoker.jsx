import React, { useState } from 'react';
import GameCard from './GameCard.jsx';
import { createShuffledDeck, evaluateHand } from './cardUtils.js';

function bestFiveOf(cards) {
  // Try all combinations of 5 from available cards
  const combos = [];
  for (let i = 0; i < cards.length - 4; i++)
    for (let j = i + 1; j < cards.length - 3; j++)
      for (let k = j + 1; k < cards.length - 2; k++)
        for (let l = k + 1; l < cards.length - 1; l++)
          for (let m = l + 1; m < cards.length; m++)
            combos.push([cards[i], cards[j], cards[k], cards[l], cards[m]]);
  return combos.reduce((best, combo) => {
    const h = evaluateHand(combo);
    return h.rank > best.rank ? h : best;
  }, { rank: -1, name: 'High Card' });
}

export default function HeadsUpPoker({ onAnswer, answered }) {
  const [deck] = useState(createShuffledDeck());
  const hole = deck.slice(0, 2);
  const opHole = deck.slice(2, 4);
  const community = deck.slice(4, 9); // 5 community cards

  const [phase, setPhase] = useState('preflop'); // preflop | flop | showdown
  const [action, setAction] = useState(null);
  const [result, setResult] = useState('');

  const visible = phase === 'preflop' ? [] : phase === 'flop' ? community.slice(0, 3) : community;

  const act = (choice) => {
    if (choice === 'fold') {
      setAction('fold');
      setPhase('showdown');
      setResult('You folded — opponent takes the pot.');
      onAnswer(false, 0);
      return;
    }
    setAction(choice);
    if (phase === 'preflop') { setPhase('flop'); return; }
    // Showdown
    const all = [...hole, ...community];
    const opAll = [...opHole, ...community];
    const myHand = bestFiveOf(all);
    const opHand = bestFiveOf(opAll);
    const win = myHand.rank > opHand.rank;
    const tie = myHand.rank === opHand.rank;
    const msg = win
      ? `You win! ${myHand.name} beats ${opHand.name}`
      : tie
        ? `Chopped pot — both have ${myHand.name}`
        : `Opponent wins with ${opHand.name} vs your ${myHand.name}`;
    setResult(msg);
    setPhase('showdown');
    onAnswer(win, choice === 'raise' ? 2 : 1);
  };

  const myEval = visible.length >= 3 ? bestFiveOf([...hole, ...visible]) : null;

  return (
    <div className="casino-game">
      <div className="casino-game-area">
        {phase === 'showdown' && (
          <>
            <div className="casino-hand-label">Opponent</div>
            <div className="casino-hand">{opHole.map((c, i) => <GameCard key={i} card={c} small />)}</div>
          </>
        )}

        <div className="casino-hand-label" style={{ marginTop: phase === 'showdown' ? '0.75rem' : 0 }}>Community Cards</div>
        <div className="casino-hand">
          {community.map((c, i) => (
            i < visible.length ? <GameCard key={i} card={c} small /> : <GameCard key={i} card={c} faceDown small />
          ))}
        </div>

        <div className="casino-hand-label" style={{ marginTop: '0.75rem' }}>Your Hole Cards</div>
        <div className="casino-hand">
          {hole.map((c, i) => <GameCard key={i} card={c} />)}
        </div>
        {myEval && (
          <p style={{ textAlign: 'center', color: 'var(--primary)', fontSize: '0.8rem', marginTop: '0.4rem' }}>{myEval.name}</p>
        )}
      </div>

      {phase !== 'showdown' && !answered && (
        <div className="casino-actions" style={{ marginTop: '1rem' }}>
          <button className="casino-btn casino-btn-secondary" onClick={() => act('fold')}>FOLD</button>
          <button className="casino-btn" style={{ background: 'var(--accent-cyan-glow)', border: '1px solid var(--accent-cyan-glow)', color: 'var(--accent-cyan)' }} onClick={() => act('call')}>
            {phase === 'preflop' ? 'CALL → SEE FLOP' : 'CALL'}
          </button>
          <button className="casino-btn casino-btn-primary" onClick={() => act('raise')}>RAISE</button>
        </div>
      )}

      {result && <p className={`casino-result ${result.startsWith('You win') ? 'result-win' : result.startsWith('Chopped') ? 'result-push' : 'result-lose'}`}>{result}</p>}
    </div>
  );
}
