import { useState } from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Button, Card } from '../../shared/components/ui/index.js';

const MOCK_NOTIFS = [
  { id: 1, type: 'deposit',     message: 'Deposit approved — 50 USDT credited',  time: '2 min ago',   read: false },
  { id: 2, type: 'match_won',   message: 'You won your match — 9 USDT credited', time: '1 hour ago',  read: false },
  { id: 3, type: 'withdrawal',  message: 'Withdrawal paid — 20 USDT sent',       time: '3 hours ago', read: true  },
  { id: 4, type: 'match_found', message: 'Match found — Rookie tier',            time: 'Yesterday',   read: true  },
];

const TYPE_ICONS = {
  deposit:     '💰',
  match_won:   '🏆',
  withdrawal:  '💸',
  match_found: '⚔️',
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);

  const markRead = (id) =>
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () =>
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
            : 'You\'re all caught up.'
        }
        action={
          <Button variant="secondary" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        }
      />

      {notifs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            color: 'var(--text-muted)',
            fontSize: '1rem',
          }}
        >
          No notifications yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifs.map((n) => (
            <Card
              key={n.id}
              hover={false}
              style={{
                padding: 0,
                borderLeft: n.read ? undefined : '3px solid var(--primary)',
                cursor: n.read ? 'default' : 'pointer',
                transition: 'opacity 0.2s',
              }}
              onClick={() => !n.read && markRead(n.id)}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    flexShrink: 0,
                  }}
                >
                  {TYPE_ICONS[n.type] ?? '🔔'}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: n.read ? 400 : 600,
                      color: 'var(--text-primary)',
                      marginBottom: 2,
                      fontSize: '0.925rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {n.message}
                  </p>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      margin: 0,
                    }}
                  >
                    {n.time}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      flexShrink: 0,
                      boxShadow: '0 0 6px var(--primary)',
                    }}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
