import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { Card, Button } from '../../shared/components/ui/index.js';
import QueueStatus from './components/QueueStatus.jsx';
import useMatchStore from '../../shared/store/matchStore.js';
import useWalletStore from '../../shared/store/walletStore.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function QueuePage() {
  const navigate = useNavigate();
  const { tierId } = useParams();
  const { queueStatus, currentTier, leaveQueue, currentMatch } = useMatchStore();
  const { releaseReservation } = useWalletStore();
  const { user } = useAuthStore();
  const [elapsed, setElapsed] = useState(0);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (queueStatus === 'starting' && currentMatch) {
      navigate(`/game/${currentMatch.matchId || currentMatch.id}`);
    }
  }, [queueStatus, currentMatch, navigate]);

  const handleCancel = () => {
    const userId = user?.id || user?.email || 'u1';
    leaveQueue(userId);
    navigate('/lobby');
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <AppLayout>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <Card>
          <QueueStatus status={queueStatus || 'searching'} tier={currentTier} />

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Time elapsed: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{formatTime(elapsed)}</span>
            </p>

            {elapsed > 90 && (!queueStatus || queueStatus === 'searching') && (
              <p style={{ color: 'var(--accent-warning)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Low activity in this tier. Consider trying another tier.
              </p>
            )}

            {(!queueStatus || queueStatus === 'searching') && (
              <Button variant="secondary" onClick={() => setShowLeaveModal(true)}>Cancel and Return to Lobby</Button>
            )}
          </div>
        </Card>
      </div>

      {/* Leave queue confirmation modal */}
      {showLeaveModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="glass-card" style={{
            maxWidth: 420, width: '100%', padding: '2rem',
            borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Leave the queue?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Your reserved entry fee will be returned to your available balance immediately.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button variant="secondary" fullWidth onClick={() => setShowLeaveModal(false)}>Stay in queue</Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => { setShowLeaveModal(false); handleCancel(); }}
              >
                Leave queue
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
