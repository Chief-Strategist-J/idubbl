import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { Card, Button } from '../../shared/components/ui/index.js';
import QueueStatus from './components/QueueStatus.jsx';
import useMatchStore from '../../shared/store/matchStore.js';
import useWalletStore from '../../shared/store/walletStore.js';

export default function QueuePage() {
  const navigate = useNavigate();
  const { tierId } = useParams();
  const { queueStatus, currentTier, leaveQueue, startNewMatch } = useMatchStore();
  const { releaseReservation } = useWalletStore();
  const [elapsed, setElapsed] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  const STATUS_STEPS = ['searching', 'matched', 'starting'];

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentTier) return;
    const delay1 = setTimeout(() => setStatusIndex(1), 4000);
    const delay2 = setTimeout(() => setStatusIndex(2), 6500);
    const delay3 = setTimeout(() => {
      const match = startNewMatch(currentTier);
      navigate(`/game/${match.id}`);
    }, 8500);
    return () => { clearTimeout(delay1); clearTimeout(delay2); clearTimeout(delay3); };
  }, [currentTier]);

  const handleCancel = () => {
    if (currentTier) releaseReservation(currentTier.entryFee);
    leaveQueue();
    navigate('/lobby');
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <AppLayout>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <Card>
          <QueueStatus status={STATUS_STEPS[statusIndex]} tier={currentTier} />

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Time elapsed: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{formatTime(elapsed)}</span>
            </p>

            {elapsed > 90 && statusIndex === 0 && (
              <p style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Low activity in this tier. Consider trying another tier.
              </p>
            )}

            {statusIndex === 0 && (
              <Button variant="secondary" onClick={handleCancel}>Cancel and Return to Lobby</Button>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
