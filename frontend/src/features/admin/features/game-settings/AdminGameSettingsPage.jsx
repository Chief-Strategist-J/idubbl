import React, { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { Card, Button, Input, PageHeader, Select } from '../../../../shared/components/ui/index.js';

export default function AdminGameSettingsPage() {
  const [roundTime, setRoundTime] = useState(20);
  const [lettersPerRound, setLettersPerRound] = useState(7);
  const [suddenDeath, setSuddenDeath] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Game Settings"
        subtitle="Configure game parameters. Changes apply to new matches only."
      />

      <div style={{ maxWidth: 640 }}>
        <Card>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* Game Type — locked */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Game Type
              </label>
              <Select
                value="word_duel"
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                <option value="word_duel">Word Duel: Anagram Sprint</option>
              </Select>
              <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Additional games are out of scope for MVP
              </p>
            </div>

            {/* Round time */}
            <div>
              <label htmlFor="gs-round-time" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Round Time (seconds)
              </label>
              <Input
                id="gs-round-time"
                type="number"
                min={5}
                max={120}
                value={roundTime}
                onChange={(e) => setRoundTime(Number(e.target.value))}
              />
            </div>

            {/* Letters per round */}
            <div>
              <label htmlFor="gs-letters" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Letters Per Round
              </label>
              <Input
                id="gs-letters"
                type="number"
                min={4}
                max={12}
                value={lettersPerRound}
                onChange={(e) => setLettersPerRound(Number(e.target.value))}
              />
            </div>

            {/* Best-of — locked */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Best-of Setting
              </label>
              <Select
                value="3"
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                <option value="3">3</option>
              </Select>
              <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Fixed at 3 for MVP
              </p>
            </div>

            {/* Tie-break toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Tie-break Rule
              </label>
              <label
                htmlFor="gs-sudden-death"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  cursor: 'pointer', userSelect: 'none',
                  padding: '0.85rem 1rem',
                  borderRadius: '0.6rem',
                  border: '1px solid var(--border)',
                  background: suddenDeath ? 'rgba(0, 227, 122, 0.06)' : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'relative', display: 'inline-flex', width: 44, height: 24,
                  borderRadius: 999, background: suddenDeath ? 'var(--primary)' : 'var(--border)',
                  transition: 'background 0.2s', flexShrink: 0,
                }}>
                  <span style={{
                    position: 'absolute', top: 3, left: suddenDeath ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
                  <input
                    id="gs-sudden-death"
                    type="checkbox"
                    checked={suddenDeath}
                    onChange={(e) => setSuddenDeath(e.target.checked)}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  />
                </span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Sudden death round</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                    When enabled, tied matches play a 4th sudden-death round to determine the winner.
                  </p>
                </div>
              </label>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.25rem' }} />

            {/* Save button */}
            <div>
              <Button type="submit" variant="primary" fullWidth>
                Save game settings
              </Button>

              {saved && (
                <p style={{
                  marginTop: '0.75rem', fontSize: '0.85rem', textAlign: 'center',
                  color: 'var(--accent-green)', fontWeight: 500,
                }}>
                  ✓ Settings saved. Changes apply to new matches only. Matches in progress are not affected.
                </p>
              )}

              {!saved && (
                <p style={{
                  marginTop: '0.75rem', fontSize: '0.78rem', textAlign: 'center',
                  color: 'var(--text-muted)',
                }}>
                  Changes apply to new matches only. Matches in progress are not affected.
                </p>
              )}
            </div>

          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
