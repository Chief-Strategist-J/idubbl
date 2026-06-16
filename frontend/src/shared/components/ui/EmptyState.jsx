import React from 'react';

export default function EmptyState({ message = 'Nothing here yet.', icon }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
      {icon && <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>}
      <p style={{ fontSize: '0.95rem' }}>{message}</p>
    </div>
  );
}
