import React, { useEffect } from 'react';
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
  const { creditWinnings } = useWalletStore();

  useEffect(() => {
    if (matchResult?.isWinner) creditWinnings(matchResult.prize);
  }, []);

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
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{matchResult.isWinner ? '🏆' : '😤'}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: matchResult.isWinner ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom: '0.5rem' }}>
            {matchResult.isWinner ? 'You Won!' : 'You Lost'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {matchResult.isWinner
              ? 'You won the match. Your prize has been credited to your balance.'
              : 'Better luck next time. Play again in the same tier or choose a different tier.'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <RoundSummary rounds={matchResult.rounds} />
          </Card>

          <Card>
            <PrizeBreakdown entryFee={matchResult.entryFee} rake={matchResult.rake} prize={matchResult.prize} isWinner={matchResult.isWinner} />
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

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="primary" fullWidth onClick={handlePlayAgain}>Play Again in Same Tier</Button>
            <Button variant="secondary" fullWidth onClick={() => { clearMatch(); navigate('/dashboard'); }}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
