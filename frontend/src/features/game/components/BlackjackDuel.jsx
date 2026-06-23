import React, { useState, useEffect } from 'react';
import GameCard from './GameCard.jsx';
import { createShuffledDeck, handTotal } from './cardUtils.js';

export default function BlackjackDuel({ onAnswer, answered }) {
  const [deck, setDeck] = useState([]);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [dealerRevealed, setDealerRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState('');

  const finish = (pCards, dCards, revealed) => {
    const pTotal = handTotal(pCards);
    const dTotal = handTotal(dCards);
    const bust = pTotal > 21;
    const dealerBust = dTotal > 21;
    const win = !bust && (dealerBust || pTotal > dTotal);
    const push = !bust && !dealerBust && pTotal === dTotal;
    const msg = bust ? 'Bust! You lose.'
      : push ? `Push — tied at ${pTotal}.`
      : win ? `You win! ${pTotal} vs ${dTotal}`
      : `Dealer wins! ${dTotal} vs ${pTotal}`;
    setResult(msg);
    setDealerRevealed(revealed);
    setDone(true);
    onAnswer(win, 0);
  };

  // Resolve dealer draw and finish given explicit card arrays (used before state settles)
  const resolveStand = (pCards, dCards, dDeckArr) => {
    let d = [...dCards];
    let rem = [...dDeckArr];
    while (handTotal(d) < 17) { d.push(rem[0]); rem = rem.slice(1); }
    finish(pCards, d, true);
  };

  // Deal initial two cards each
  useEffect(() => {
    const d = createShuffledDeck();
    const pCards = [d[0], d[2]];
    const dCards = [d[1], d[3]];
    const rem = d.slice(4);
    setPlayer(pCards);
    setDealer(dCards);
    setDeck(rem);
    // Natural 21: auto-resolve immediately with the local values (state not yet applied)
    if (handTotal(pCards) === 21) {
      resolveStand(pCards, dCards, rem);
    }
  }, []); // eslint-disable-line

  // After a HIT lands exactly 21 (player.length > 2 means it's post-deal)
  useEffect(() => {
    if (player.length > 2 && handTotal(player) === 21 && !done && !answered) {
      resolveStand(player, dealer, deck);
    }
  }, [player]); // eslint-disable-line

  const hit = () => {
    if (done || answered) return;
    const newCard = deck[0];
    const newDeck = deck.slice(1);
    const newPlayer = [...player, newCard];
    setDeck(newDeck);
    setPlayer(newPlayer);
    if (handTotal(newPlayer) > 21) {
      finish(newPlayer, dealer, true);
    }
    // If exactly 21, useEffect above will auto-stand
  };

  const handleStand = () => {
    if (done || answered) return;
    resolveStand(player, dealer, deck);
  };

  const pTotal = handTotal(player);

  return (
    <div className="casino-game">
      <div className="casino-game-area">
        <div className="casino-hand-label">Dealer</div>
        <div className="casino-hand">
          {dealer.map((c, i) => (
            <GameCard key={i} card={c} faceDown={!dealerRevealed && i === 1} />
          ))}
        </div>

        <div style={{ textAlign: 'center', margin: '1.25rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>— table —</div>

        <div className="casino-hand-label">
          You — Total: <span style={{ color: pTotal > 21 ? 'var(--accent-red)' : pTotal >= 18 ? 'var(--accent-green)' : 'var(--text-primary)' }}>{pTotal}</span>
        </div>
        <div className="casino-hand">
          {player.map((c, i) => <GameCard key={i} card={c} />)}
        </div>
      </div>

      {result && (
        <p className={`casino-result ${result.startsWith('You win') ? 'result-win' : result.startsWith('Push') ? 'result-push' : 'result-lose'}`}>{result}</p>
      )}

      {!done && !answered && player.length > 0 && (
        <div className="casino-actions">
          <button className="casino-btn casino-btn-secondary" onClick={hit}>HIT</button>
          <button className="casino-btn casino-btn-primary" onClick={handleStand}>STAND</button>
        </div>
      )}
    </div>
  );
}
