import React, { useState } from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Button, Card } from '../../shared/components/ui/index.js';
import TierCard from './components/TierCard.jsx';
import useMatchStore from '../../shared/store/matchStore.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function LobbyPage() {
  const { tiers } = useMatchStore();
  const { user } = useAuthStore();
  const activeTiers = tiers.filter((t) => t.active);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!friendEmail) return;
    setLoading(true);
    setMessage('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
      const res = await fetch(`${apiBase}/api/match/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendEmail,
          senderName: user?.name || user?.email || 'A friend'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Invitation successfully sent!');
        setFriendEmail('');
      } else {
        setMessage(data.error || 'Failed to send invitation.');
      }
    } catch (err) {
      setMessage('Network error sending invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Choose a tier to enter the next available match."
        subtitle="Your entry fee will be reserved when you join."
      />

      <div className="matchmaking-grid">
        {activeTiers.map((tier) => <TierCard key={tier.id} tier={tier} />)}
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <Button variant="secondary" onClick={() => setShowInviteModal(true)}>
          ✉️ Invite a Friend to Play
        </Button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
        All matches are best of 3 rounds · Word Duel game type · Results are server-authoritative
      </p>

      {showInviteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="glass-card" style={{
            maxWidth: 480, width: '100%', padding: '2.5rem',
            borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
            border: '1px solid var(--border)'
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Invite a Friend</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Challenge your friends directly to live USDT duel matches on iDubbl!
              </p>
            </div>

            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Friend's Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="friend@example.com"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem'
                  }}
                />
              </div>

              {message && (
                <p style={{
                  fontSize: '0.85rem',
                  color: message.includes('sent') ? 'var(--accent-green)' : 'var(--accent-red)',
                  textAlign: 'center', margin: 0
                }}>
                  {message}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button variant="secondary" fullWidth type="button" onClick={() => { setShowInviteModal(false); setMessage(''); }}>
                  Close
                </Button>
                <Button variant="primary" fullWidth type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
