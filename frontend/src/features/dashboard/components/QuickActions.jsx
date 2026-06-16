import React from 'react';
import { useNavigate } from 'react-router-dom';

const ACTIONS = [
  { label: '🎯  Play Now', path: '/lobby', variant: 'primary' },
  { label: '💳  Deposit', path: '/deposit', variant: 'secondary' },
  { label: '💸  Withdraw', path: '/withdraw', variant: 'secondary' },
  { label: '📋  History', path: '/transactions', variant: 'secondary' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="quick-actions-grid">
      {ACTIONS.map((a) => (
        <button
          key={a.path}
          className={`quick-action-btn ${a.variant === 'primary' ? 'quick-action-primary' : 'quick-action-secondary'}`}
          onClick={() => navigate(a.path)}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
