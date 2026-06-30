import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/index.js';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="hero-badge">
        Real-time 1v1 Skill Contests
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
        Play fast skill matches.
        <br />
        <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Win the pool.
        </span>
      </h1>

      <p className="hero-subtitle">
        Fund your wallet, join a tier, get matched instantly. Highest skill wins.
      </p>
      <p className="hero-desc">
        Instant matchmaking. Transparent prizes. Fast payouts.
      </p>

      <div className="hero-actions-container">
        <Button variant="primary" onClick={() => navigate('/signup')}>Play and Win with Skill</Button>
      </div>
    </section>
  );
}
