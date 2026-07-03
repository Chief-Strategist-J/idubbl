import React, { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { Card, Button, PageHeader } from '../../../../shared/components/ui/index.js';
import usePlatformStore, { ALL_GAMES } from '../../../../shared/store/platformStore.js';
import useAuthStore from '../../../../shared/store/authStore.js';

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
    fetchPlatformSettings, savePlatformSettings,
  } = usePlatformStore();

  const { user } = useAuthStore();
  const [flwSecretKey, setFlwSecretKey] = useState('');
  const [flwPublicKey, setFlwPublicKey] = useState('');
  const [flwEncryptionKey, setFlwEncryptionKey] = useState('');
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysSaved, setKeysSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const [kycRequired, setKycRequired] = useState(true);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycSaved, setKycSaved] = useState(false);

  React.useEffect(() => {
    fetchPlatformSettings();
    const uid = user?.id || user?._id;
    if (!uid) return;
    let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
    if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
      apiBase = `https://${apiBase}`;
    }

    // Fetch Flutterwave settings
    fetch(`${apiBase}/api/admin/settings/flutterwave`, {
      headers: { 'x-user-id': uid },
      credentials: 'include'
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setFlwSecretKey(res.data.secretKey || '');
          setFlwPublicKey(res.data.publicKey || '');
          setFlwEncryptionKey(res.data.encryptionKey || '');
        }
        setKeysLoading(false);
      })
      .catch(err => {
        console.error('Error fetching flutterwave keys:', err);
        setKeysLoading(false);
      });

    // Fetch KYC settings
    fetch(`${apiBase}/api/admin/settings/kyc`, {
      headers: { 'x-user-id': uid },
      credentials: 'include'
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setKycRequired(res.data.kycRequired !== false);
        }
        setKycLoading(false);
      })
      .catch(err => {
        console.error('Error fetching KYC settings:', err);
        setKycLoading(false);
      });
  }, [user]);

  const handleSaveKeys = async () => {
    const uid = user?.id || user?._id;
    if (!uid) return;
    let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
    if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
      apiBase = `https://${apiBase}`;
    }
    try {
      const response = await fetch(`${apiBase}/api/admin/settings/flutterwave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': uid
        },
        credentials: 'include',
        body: JSON.stringify({
          secretKey: flwSecretKey,
          publicKey: flwPublicKey,
          encryptionKey: flwEncryptionKey
        })
      });
      const data = await response.json();
      if (data.success) {
        setKeysSaved(true);
        setTimeout(() => setKeysSaved(false), 3000);
      }
    } catch (e) {
      console.error('Error saving flutterwave keys:', e);
    }
  };

  const handleSaveKyc = async (newVal) => {
    const uid = user?.id || user?._id;
    if (!uid) return;
    setKycRequired(newVal);
    let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
    if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
      apiBase = `https://${apiBase}`;
    }
    try {
      const response = await fetch(`${apiBase}/api/admin/settings/kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': uid
        },
        credentials: 'include',
        body: JSON.stringify({
          kycRequired: newVal
        })
      });
      const data = await response.json();
      if (data.success) {
        setKycSaved(true);
        setTimeout(() => setKycSaved(false), 2000);
      }
    } catch (e) {
      console.error('Error saving KYC settings:', e);
    }
  };

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const handleSave = async () => {
    const uid = user?.id || user?._id;
    if (uid) {
      await savePlatformSettings(uid);
    }
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

        {/* ── Identity Verification (KYC) ─────────────────────────── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: kycRequired ? '0' : '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                🛡️ Identity Verification (KYC)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                When disabled, KYC verification is not required for withdrawals, and the verification section is hidden from player profiles.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {kycSaved && <span style={{ color: 'var(--accent-green)', fontSize: '0.75rem', fontWeight: 600 }}>Saved!</span>}
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                color: kycRequired ? 'var(--primary)' : 'var(--text-muted)'
              }}>
                {kycRequired ? 'Required' : 'Disabled'}
              </span>
              <Toggle
                id="kyc-toggle"
                checked={kycRequired}
                onChange={handleSaveKyc}
              />
            </div>
          </div>
          {!kycRequired && (
            <div style={{
              padding: '0.6rem 0.9rem', background: 'rgba(255,176,32,0.06)',
              border: '1px solid rgba(255,176,32,0.2)', borderRadius: '8px',
              fontSize: '0.78rem', color: '#ffb020'
            }}>
              ⚠️ KYC is currently <strong>disabled</strong>. Users can perform withdrawals without identity verification.
            </div>
          )}
        </Card>

        {/* ── Flutterwave Keys ─────────────────────────────────── */}
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
            💳 Flutterwave API Keys
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '1.25rem' }}>
            Configure live or test payment gateway credentials. These settings are stored securely in the database and applied dynamically without restarting the server.
          </p>

          {keysLoading ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading credentials...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Secret Key (FLWSECK_TEST / FLWSECK)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={flwSecretKey}
                    onChange={e => setFlwSecretKey(e.target.value)}
                    placeholder="Enter secret key..."
                    style={{
                      flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem',
                      background: 'var(--bg-darker)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text-primary)', outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    style={{
                      padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer'
                    }}
                  >
                    {showSecret ? '🙈 Hide' : '👁️ Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(flwSecretKey);
                      alert('Secret Key copied to clipboard!');
                    }}
                    style={{
                      padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer'
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Public Key (FLWPUBK_TEST / FLWPUBK)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={flwPublicKey}
                    onChange={e => setFlwPublicKey(e.target.value)}
                    placeholder="Enter public key..."
                    style={{
                      flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem',
                      background: 'var(--bg-darker)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text-primary)', outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(flwPublicKey);
                      alert('Public Key copied to clipboard!');
                    }}
                    style={{
                      padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer'
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Encryption Key
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={flwEncryptionKey}
                    onChange={e => setFlwEncryptionKey(e.target.value)}
                    placeholder="Enter encryption key..."
                    style={{
                      flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem',
                      background: 'var(--bg-darker)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text-primary)', outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(flwEncryptionKey);
                      alert('Encryption Key copied to clipboard!');
                    }}
                    style={{
                      padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer'
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
                <Button variant="primary" onClick={handleSaveKeys}>
                  🔒 Save Payment Keys
                </Button>
                {keysSaved && (
                  <span style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                    ✓ Keys updated and secured in DB
                  </span>
                )}
              </div>
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
          <Button variant="secondary" onClick={async () => {
            resetToDefaults();
            const uid = user?.id || user?._id;
            if (uid) {
              setTimeout(async () => {
                await savePlatformSettings(uid);
              }, 100);
            }
          }}>
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
