import React from 'react';

const SIZES = { sm: 16, md: 24, lg: 40 };

export default function Spinner({ size = 'md', color = 'var(--primary)' }) {
  const px = SIZES[size] || SIZES.md;
  return (
    <span
      style={{
        display: 'inline-block',
        width: px,
        height: px,
        border: `2px solid rgba(0,0,0,0.08)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
}
