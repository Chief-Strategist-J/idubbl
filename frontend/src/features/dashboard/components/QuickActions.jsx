import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/index.js';

const ACTIONS = [
  { label: '🎯  Play Now', path: '/lobby', variant: 'primary' },
  { label: '💳  Deposit', path: '/deposit', variant: 'secondary' },
  { label: '💸  Withdraw', path: '/withdraw', variant: 'secondary' },
  { label: '📋  History', path: '/transactions', variant: 'secondary' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {ACTIONS.map((a) => (
        <Button key={a.path} variant={a.variant} onClick={() => navigate(a.path)}>
          {a.label}
        </Button>
      ))}
    </div>
  );
}
