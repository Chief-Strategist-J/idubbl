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

  useEffect(() => {
    const d = createShuffledDeck();
    setDeck(d.slice(4));
    setPlayer([d[0], d[2]]);
    setDealer([d[1], d[3]]);
  }, []);

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

  const hit = () => {
    if (done || answered) return;
    const newCard = deck[0];
    const newDeck = deck.slice(1);
    const newPlayer = [...player, newCard];
    setDeck(newDeck);
    setPlayer(newPlayer);
    if (handTotal(newPlayer) > 21) {
      finish(newPlayer, dealer, true); // reveal dealer on bust
    }
  };

  const stand = () => {
    if (done || answered) return;
    let dCards = [...dealer];
    let dDeck = [...deck];
    while (handTotal(dCards) < 17) {
      dCards.push(dDeck[0]);
      dDeck = dDeck.slice(1);
    }
    finish(player, dCards, true);
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

        <div className="casino-hand-label">You — Total: <span style={{ color: pTotal > 21 ? '#f87171' : pTotal >= 18 ? '#4ade80' : 'var(--text-primary)' }}>{pTotal}</span></div>
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
          <button className="casino-btn casino-btn-primary" onClick={stand}>STAND</button>
        </div>
      )}
    </div>
  );
}
