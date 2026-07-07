import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { Card, Button, PageHeader } from '../../shared/components/ui/index.js';
import RoundSummary from './components/RoundSummary.jsx';
import PrizeBreakdown from './components/PrizeBreakdown.jsx';
import useMatchStore from '../../shared/store/matchStore.js';
import useWalletStore from '../../shared/store/walletStore.js';

export default function ResultPage() {
  const navigate = useNavigate();
  const { matchResult, clearMatch } = useMatchStore();
  const { creditWinnings, availableBalance } = useWalletStore();

  const settled = useRef(false);
  useEffect(() => {
    if (matchResult && !settled.current) {
      settled.current = true;
      creditWinnings(matchResult.isWinner ? matchResult.prize : 0, {
        entryFee: matchResult.entryFee,
        isTie: matchResult.isTie || false,
        refId: matchResult.refId,
        matchId: matchResult.refId,
        tier: matchResult.tierName || 'Rookie'
      });
    }
  }, [matchResult]);

  if (!matchResult) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No match result found. <button className="nav-btn" onClick={() => navigate('/lobby')}>Go to lobby</button>
        </div>
      </AppLayout>
    );
  }

  const handlePlayAgain = () => { clearMatch(); navigate('/lobby'); };

  return (
    <AppLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {matchResult.isWinner ? '🏆' : (matchResult.isTie ? '🤝' : '😤')}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: matchResult.isWinner ? 'var(--accent-green)' : (matchResult.isTie ? 'var(--text-primary)' : 'var(--accent-red)'), marginBottom: '0.5rem' }}>
            {matchResult.isWinner ? 'You Won!' : (matchResult.isTie ? 'Match Tied!' : 'You Lost')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {matchResult.isWinner
              ? 'You won the match. Your prize has been credited to your balance.'
              : (matchResult.isTie
                  ? 'It was a tie! Your locked entry fee has been released back to your balance.'
                  : 'Better luck next time. Play again in the same tier or choose a different tier.')}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <RoundSummary rounds={matchResult.rounds} />
          </Card>

          <Card>
            <PrizeBreakdown entryFee={matchResult.entryFee} rake={matchResult.rake} prize={matchResult.prize} isWinner={matchResult.isWinner} />
          </Card>

          <Card style={{ background: 'rgba(0, 227, 122, 0.06)', borderColor: 'var(--hologram-card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>New available balance</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-green)', fontSize: '1.1rem' }}>
                {availableBalance.toFixed(2)} USDT
              </span>
            </div>
          </Card>

          <Card style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Match ID</p>
                <code style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{matchResult.refId}</code>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Settled at</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(matchResult.settledAt).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <Button variant="primary" onClick={handlePlayAgain}>Play Again in Same Tier</Button>
            <Button variant="secondary" onClick={() => { clearMatch(); navigate('/lobby'); }}>Choose a Different Tier</Button>
            <Button style={{ background: 'var(--accent-green-glow)', borderColor: 'rgba(0, 227, 122, 0.4)', color: 'var(--accent-green)' }} onClick={() => { clearMatch(); navigate('/withdraw'); }}>Withdraw Winnings</Button>
            <Button variant="secondary" onClick={() => { clearMatch(); navigate('/dashboard'); }}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
