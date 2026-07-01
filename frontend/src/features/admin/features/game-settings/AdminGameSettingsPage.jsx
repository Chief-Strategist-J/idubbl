import React, { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { Card, Button, PageHeader } from '../../../../shared/components/ui/index.js';
import usePlatformStore, { ALL_GAMES } from '../../../../shared/store/platformStore.js';

function Toggle({ checked, onChange, id }) {
  return (
    <label htmlFor={id} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{
        position: 'relative', display: 'inline-flex', width: 44, height: 24,
        borderRadius: 999, background: checked ? 'var(--primary)' : 'var(--border)',
        transition: 'background 0.2s', flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
      </span>
    </label>
  );
}

const CATEGORIES = ['All', 'Skill Duels', 'Card Games', 'Chance', 'Board Games'];

export default function AdminGameSettingsPage() {
  const {
    gameVisibility, chatEnabled,
    setGameVisible, setChatEnabled,
    resetToDefaults,
  } = usePlatformStore();

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const filteredGames = ALL_GAMES.filter(g =>
    activeTab === 'All' || g.category === activeTab
  );

  const visibleCount = ALL_GAMES.filter(g => gameVisibility[g.id] !== false).length;

  return (
    <AdminLayout>
      <PageHeader
        title="Platform Settings"
        subtitle="Control which games are visible to users and toggle platform features."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 760 }}>

        {/* ── Chat Feature ─────────────────────────────────────── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                💬 Chat Feature
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                When disabled, the chat link is hidden from all users and the chat page is inaccessible.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                color: chatEnabled ? 'var(--primary)' : 'var(--text-muted)'
              }}>
                {chatEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Toggle
                id="chat-toggle"
                checked={chatEnabled}
                onChange={setChatEnabled}
              />
            </div>
          </div>
          {!chatEnabled && (
            <div style={{
              padding: '0.6rem 0.9rem', background: 'rgba(255,90,90,0.08)',
              border: '1px solid rgba(255,90,90,0.2)', borderRadius: '8px',
              fontSize: '0.78rem', color: '#ff7070'
            }}>
              ⚠️ Chat is currently <strong>disabled</strong>. Users will not see the Chat option in navigation.
            </div>
          )}
        </Card>

        {/* ── Game Visibility ───────────────────────────────────── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                🎮 Game Visibility
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                {visibleCount} of {ALL_GAMES.length} games currently visible to users.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => ALL_GAMES.forEach(g => setGameVisible(g.id, true))}
                style={{
                  padding: '0.35rem 0.8rem', fontSize: '0.75rem', fontWeight: 600,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer'
                }}
              >
                Show All
              </button>
              <button
                onClick={() => ALL_GAMES.forEach(g => setGameVisible(g.id, false))}
                style={{
                  padding: '0.35rem 0.8rem', fontSize: '0.75rem', fontWeight: 600,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer'
                }}
              >
                Hide All
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                style={{
                  padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: activeTab === cat ? 'rgba(0,227,122,0.15)' : 'var(--bg-card)',
                  color: activeTab === cat ? 'var(--primary)' : 'var(--text-secondary)',
                  border: activeTab === cat ? '1px solid var(--primary)' : '1px solid var(--border)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Game Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredGames.map(game => {
              const visible = gameVisibility[game.id] !== false;
              return (
                <div
                  key={game.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: visible ? 'rgba(0,227,122,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${visible ? 'rgba(0,227,122,0.15)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    transition: 'all 0.2s',
                    opacity: visible ? 1 : 0.55,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{game.icon}</span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                        {game.name}
                        {game.freePlay && (
                          <span style={{
                            marginLeft: '0.5rem', fontSize: '0.6rem', fontWeight: 700,
                            padding: '0.1rem 0.4rem', borderRadius: '4px',
                            background: 'rgba(0,227,122,0.15)', color: 'var(--primary)',
                            border: '1px solid rgba(0,227,122,0.3)', verticalAlign: 'middle'
                          }}>FREE</span>
                        )}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                        {game.category} · ID: {game.id}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                      color: visible ? 'var(--primary)' : 'var(--text-muted)'
                    }}>
                      {visible ? 'Visible' : 'Hidden'}
                    </span>
                    <Toggle
                      id={`game-toggle-${game.id}`}
                      checked={visible}
                      onChange={v => setGameVisible(game.id, v)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Save & Reset ─────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button variant="primary" onClick={handleSave}>
            💾 Save Settings
          </Button>
          <Button variant="secondary" onClick={resetToDefaults}>
            🔄 Reset to Defaults
          </Button>
          {saved && (
            <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
              ✓ Settings saved! Changes visible to users immediately.
            </span>
          )}
        </div>

        {/* ── Info Note ─────────────────────────────────────────── */}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.6 }}>
          Settings are saved locally and applied immediately. Hidden games disappear from the Games page,
          Lobby, and navigation. Free-play games (like Ludo) are hidden from the games catalogue but their
          direct URL remains accessible.
        </p>
      </div>
    </AdminLayout>
  );
}
