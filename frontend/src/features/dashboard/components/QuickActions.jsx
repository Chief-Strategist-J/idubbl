import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, ArrowUpRight, History, BookOpen, HelpCircle } from 'lucide-react';

const ACTIONS = [
  { label: 'Play Now', path: '/lobby', variant: 'primary', icon: Zap },
  { label: 'Deposit', path: '/deposit', variant: 'secondary', icon: Plus },
  { label: 'Withdraw', path: '/withdraw', variant: 'secondary', icon: ArrowUpRight },
  { label: 'History', path: '/transactions', variant: 'secondary', icon: History },
  { label: 'User Guide', path: '/guide', variant: 'secondary', icon: BookOpen },
  { label: 'Help & Support', path: '/support', variant: 'secondary', icon: HelpCircle },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="quick-actions-grid">
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.path}
            className={`quick-action-btn ${a.variant === 'primary' ? 'quick-action-primary' : 'quick-action-secondary'}`}
            onClick={() => navigate(a.path)}
          >
            <Icon size={18} className="quick-action-icon" />
            <span>{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

