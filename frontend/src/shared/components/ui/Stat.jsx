import React from 'react';

export default function Stat({ label, value, highlight = false, prefix = '', suffix = '' }) {
  return (
    <div className="stat-card glass-card">
      <p className="stat-label">{label}</p>
      <p className={`stat-val ${highlight ? 'highlight' : ''}`}>
        {prefix}{value}{suffix}
      </p>
    </div>
  );
}
