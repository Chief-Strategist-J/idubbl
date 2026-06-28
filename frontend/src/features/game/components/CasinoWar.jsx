import React, { useState } from 'react';
import GameCard from './GameCard.jsx';
import { createShuffledDeck, rankOrder } from './cardUtils.js';

export default function CasinoWar({ onAnswer, answered }) {
  const [phase, setPhase] = useState('start'); // start | revealed | war | done
  const [deck] = useState(createShuffledDeck());
  const [playerCard, setPlayerCard] = useState(null);
  const [dealerCard, setDealerCard] = useState(null);
  const [warPlayer, setWarPlayer] = useState(null);
  const [warDealer, setWarDealer] = useState(null);
  const [result, setResult] = useState('');

  const deal = () => {
    if (answered) return;
    const pCard = deck[0];
    const dCard = deck[1];
    setPlayerCard(pCard);
    setDealerCard(dCard);

    const pRank = rankOrder(pCard.rank);
    const dRank = rankOrder(dCard.rank);

    if (pRank > dRank) {
      setResult('You win! Your card is higher.');
      setPhase('done');
      onAnswer(true, 0);
    } else if (dRank > pRank) {
      setResult('Dealer wins! Higher card beats yours.');
      setPhase('done');
      onAnswer(false, 0);
    } else {
      setPhase('revealed'); // tie → go to war
    }
  };

  const goToWar = () => {
    if (answered) return;
    const wp = deck[4];
    const wd = deck[5];
    setWarPlayer(wp);
    setWarDealer(wd);
    const win = rankOrder(wp.rank) >= rankOrder(wd.rank);
    setResult(win ? 'WAR WON! Your battle card wins!' : 'WAR LOST! Dealer takes the battle.');
    setPhase('done');
    onAnswer(win, 1);
  };

  const surrender = () => {
    if (answered) return;
    setResult('You surrendered — forfeit half your bet.');
    setPhase('done');
    onAnswer(false, 2);
  };

  return (
    <div className="casino-game">
      {phase === 'start' && (
        <>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            One card each — higher card wins. Ties go to war!
          </p>
          <div className="casino-actions">
            <button className="casino-btn casino-btn-primary" style={{ flex: 1 }} onClick={deal} disabled={answered}>DEAL CARDS</button>
          </div>
        </>
      )}

      {phase !== 'start' && (
        <div className="casino-game-area">
          <div className="casino-hand-label">Dealer</div>
          <div className="casino-hand">{dealerCard && <GameCard card={dealerCard} />}{warDealer && <GameCard card={warDealer} />}</div>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.75rem 0' }}>vs</div>
          <div className="casino-hand-label">You</div>
          <div className="casino-hand">{playerCard && <GameCard card={playerCard} />}{warPlayer && <GameCard card={warPlayer} />}</div>

          {phase === 'revealed' && (
            <>
              <p style={{ textAlign: 'center', color: 'var(--accent-warning)', fontWeight: 700, margin: '1rem 0 0.5rem', letterSpacing: 2 }}>⚔ TIE — GO TO WAR?</p>
              <div className="casino-actions">
                <button className="casino-btn casino-btn-primary" onClick={goToWar} disabled={answered}>GO TO WAR</button>
                <button className="casino-btn casino-btn-secondary" onClick={surrender} disabled={answered}>SURRENDER</button>
              </div>
            </>
          )}

          {result && <p className={`casino-result ${result.startsWith('You win') || result.startsWith('WAR WON') ? 'result-win' : 'result-lose'}`}>{result}</p>}
        </div>
      )}
    </div>
  );
}
