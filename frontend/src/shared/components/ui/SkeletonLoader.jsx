import React from 'react';

/**
 * Skeleton loader — use instead of spinners for list/content placeholders.
 * Usage: <SkeletonLoader rows={5} /> or <SkeletonLoader type="card" />
 */
export default function SkeletonLoader({ rows = 3, type = 'row', height, width = '100%', style = {} }) {
  if (type === 'card') {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        ...style,
      }}>
        <SkeletonPulse height={20} width="60%" style={{ marginBottom: '0.75rem' }} />
        <SkeletonPulse height={14} width="90%" style={{ marginBottom: '0.4rem' }} />
        <SkeletonPulse height={14} width="75%" />
      </div>
    );
  }

  if (type === 'stat') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', ...style }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
            <SkeletonPulse height={12} width="50%" style={{ marginBottom: '0.75rem' }} />
            <SkeletonPulse height={28} width="70%" />
          </div>
        ))}
      </div>
    );
  }

  // Default: row list
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', ...style }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <SkeletonPulse height={36} width={36} style={{ borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonPulse height={13} width={`${60 + (i * 7) % 25}%`} style={{ marginBottom: '0.4rem' }} />
            <SkeletonPulse height={11} width={`${40 + (i * 5) % 20}%`} />
          </div>
          <SkeletonPulse height={13} width={60} />
        </div>
      ))}
    </div>
  );
}

function SkeletonPulse({ height = 16, width = '100%', style = {} }) {
  return (
    <div style={{
      height,
      width,
      borderRadius: 6,
      background: 'linear-gradient(90deg, var(--border) 25%, var(--bg-card-hover) 50%, var(--border) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.5s infinite',
      ...style,
    }} />
  );
}
