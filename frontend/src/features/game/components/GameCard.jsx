import React from 'react';
import { isRed } from './cardUtils.js';

export default function GameCard({ card, faceDown = false, small = false, selected = false, onClick }) {
  const w = small ? 42 : 58;
  const h = small ? 60 : 82;
  const fs = small ? '0.65rem' : '0.8rem';

  const base = {
    width: w, height: h, borderRadius: 7, flexShrink: 0, cursor: onClick ? 'pointer' : 'default',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: small ? '2px 3px' : '4px 5px', userSelect: 'none', transition: 'transform 0.15s, box-shadow 0.15s',
    transform: selected ? 'translateY(-10px)' : 'none',
  };

  if (faceDown) {
    return (
      <div style={{ ...base, background: 'linear-gradient(135deg, #064e3b, #052e23)', border: '1.5px solid rgba(0,245,160,0.35)', alignItems: 'center', justifyContent: 'center' }} onClick={onClick}>
        <div style={{ fontSize: small ? '1.1rem' : '1.4rem', lineHeight: 1 }}>🂠</div>
      </div>
    );
  }

  const red = isRed(card.suit);
  const color = red ? '#dc2626' : '#111827';

  return (
    <div
      style={{ ...base, background: '#fff', border: selected ? '2px solid #00f5a0' : '1.5px solid rgba(0,0,0,0.12)', boxShadow: selected ? '0 0 12px rgba(0,245,160,0.5)' : '0 2px 6px rgba(0,0,0,0.25)', color }}
      onClick={onClick}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: fs, lineHeight: 1.15 }}>{card.rank}<br />{card.suit}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: fs, lineHeight: 1.15, transform: 'rotate(180deg)', alignSelf: 'flex-end' }}>{card.rank}<br />{card.suit}</div>
    </div>
  );
}
