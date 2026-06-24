import React, { useState } from 'react';
import GameCard from './GameCard.jsx';
import { createShuffledDeck, bacTotal } from './cardUtils.js';

export default function BaccaratDuel({ onAnswer, answered }) {
  const [bet, setBet] = useState(null);
  const [cards, setCards] = useState(null);
  const [result, setResult] = useState('');

  const placeBet = (choice) => {
    if (answered) return;
    setBet(choice);
    const d = createShuffledDeck();
    const pCards = [d[0], d[2]];
    const bCards = [d[1], d[3]];
    let idx = 4;
    let pTotal = bacTotal(pCards);
    let bTotal = bacTotal(bCards);

    // Naturals (8 or 9): no further cards drawn for either side
    if (pTotal < 8 && bTotal < 8) {
      // Player draws on 0–5; stands on 6–7
      if (pTotal <= 5) {
        pCards.push(d[idx++]);
        pTotal = bacTotal(pCards);
      }

      // Banker third-card table (official rules):
      //   If player stood (2 cards): banker draws on 0–5
      //   If player drew:
      //     Banker 0-2: always draw
      //     Banker 3:   draw unless player's 3rd card = 8
      //     Banker 4:   draw if player's 3rd card ∈ {2,3,4,5,6,7}
      //     Banker 5:   draw if player's 3rd card ∈ {4,5,6,7}
      //     Banker 6:   draw if player's 3rd card ∈ {6,7}
      //     Banker 7:   stand
      let bankerDraws = false;
      if (pCards.length === 2) {
        bankerDraws = bTotal <= 5;
      } else {
        const p3 = bacTotal([pCards[2]]);
        if (bTotal <= 2) bankerDraws = true;
        else if (bTotal === 3) bankerDraws = p3 !== 8;
        else if (bTotal === 4) bankerDraws = p3 >= 2 && p3 <= 7;
        else if (bTotal === 5) bankerDraws = p3 >= 4 && p3 <= 7;
        else if (bTotal === 6) bankerDraws = p3 === 6 || p3 === 7;
        // bTotal 7: no draw
      }
      if (bankerDraws) {
        bCards.push(d[idx++]);
        bTotal = bacTotal(bCards);
      }
    }

    const winner = pTotal > bTotal ? 'Player' : bTotal > pTotal ? 'Banker' : 'Tie';
    const win = choice === winner;
    setCards({ pCards, bCards, pTotal, bTotal, winner });
    const winMsg = winner === 'Tie'
      ? `You win! Tie — both scored ${pTotal}`
      : `You win! ${winner} wins ${pTotal} vs ${bTotal}`;
    setResult(win ? winMsg : `${winner} wins — you bet ${choice}`);
    onAnswer(win, ['Player', 'Banker', 'Tie'].indexOf(choice));
  };

  return (
    <div className="casino-game">
      {!bet ? (
        <>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Bet on which hand wins — closest to 9 wins
          </p>
          <div className="casino-actions" style={{ gap: '0.75rem' }}>
            <button className="casino-btn casino-btn-secondary" style={{ flex: 1 }} onClick={() => placeBet('Player')}>PLAYER<br /><span style={{ fontSize: '0.7rem', opacity: 0.7 }}>pays 1:1</span></button>
            <button className="casino-btn casino-btn-primary" style={{ flex: 1 }} onClick={() => placeBet('Banker')}>BANKER<br /><span style={{ fontSize: '0.7rem', opacity: 0.7 }}>pays 0.95:1</span></button>
            <button className="casino-btn" style={{ flex: 1, background: 'var(--accent-warning-glow)', border: '1px solid var(--accent-warning-glow)', color: 'var(--accent-warning)' }} onClick={() => placeBet('Tie')}>TIE<br /><span style={{ fontSize: '0.7rem', opacity: 0.7 }}>pays 8:1</span></button>
          </div>
        </>
      ) : cards && (
        <div className="casino-game-area">
          <div className="casino-hand-label">Player — {cards.pTotal}</div>
          <div className="casino-hand">{cards.pCards.map((c, i) => <GameCard key={i} card={c} small />)}</div>
          <div className="casino-hand-label" style={{ marginTop: '1rem' }}>Banker — {cards.bTotal}</div>
          <div className="casino-hand">{cards.bCards.map((c, i) => <GameCard key={i} card={c} small />)}</div>
          <p className={`casino-result ${result.startsWith('You win') ? 'result-win' : 'result-lose'}`}>{result}</p>
        </div>
      )}
    </div>
  );
}
