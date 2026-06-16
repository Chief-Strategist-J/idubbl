import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/index.js';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section style={{ textAlign: 'center', padding: '5rem 1rem 3rem' }}>
      <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '0.25rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--primary)' }}>
        Real-time 1v1 Skill Contests
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
        Play fast skill matches.
        <br />
        <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Win the pool.
        </span>
      </h1>

      <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: 520, margin: '0 auto 0.75rem' }}>
        Fund your wallet, join a tier, get matched instantly. Highest skill wins.
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 480, margin: '0 auto 2.5rem' }}>
        Instant matchmaking. Transparent prizes. Fast payouts.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={() => navigate('/signup')}>Play and Win with Skill</Button>
        <Button variant="secondary" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
          View How It Works
        </Button>
      </div>
    </section>
  );
}
