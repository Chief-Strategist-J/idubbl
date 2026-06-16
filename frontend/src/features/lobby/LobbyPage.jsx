import React from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader } from '../../shared/components/ui/index.js';
import TierCard from './components/TierCard.jsx';
import useMatchStore from '../../shared/store/matchStore.js';

export default function LobbyPage() {
  const { tiers } = useMatchStore();
  const activeTiers = tiers.filter((t) => t.active);

  return (
    <AppLayout>
      <PageHeader
        title="Choose Your Tier"
        subtitle="Choose a tier to enter the next available match. Your entry fee will be reserved when you join."
      />

      <div className="matchmaking-grid">
        {activeTiers.map((tier) => <TierCard key={tier.id} tier={tier} />)}
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
        All matches are best of 3 rounds · Word Duel game type · Results are server-authoritative
      </p>
    </AppLayout>
  );
}
