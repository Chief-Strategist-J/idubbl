import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import useThemeStore from '../../store/themeStore.js';

export default function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  return (
    <div className="theme-selector-container" style={{ position: 'relative' }}>
      <button
        className="theme-selector-btn"
        onClick={() => setThemeMenuOpen(!themeMenuOpen)}
        aria-label="Switch Theme"
        style={{
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '0.5rem',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: themeMenuOpen ? '0 0 10px var(--primary-glow)' : 'none'
        }}
      >
        <Palette size={20} />
      </button>
      {themeMenuOpen && (
        <>
          <div
            className="theme-dropdown-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
            onClick={() => setThemeMenuOpen(false)}
          />
          <div
            className="theme-dropdown glass-card"
            style={{
              position: 'absolute',
              top: '130%',
              right: 0,
              width: '180px',
              padding: '0.75rem',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              borderRadius: '12px'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>SELECT THEME</div>
            {[
              { id: 'purple', name: 'Cyber-Luxe', color: '#8b5cf6' },
              { id: 'gold', name: 'Solar Flare', color: '#f59e0b' },
              { id: 'emerald', name: 'Emerald Forest', color: '#10b981' },
              { id: 'cyber-sunset', name: 'Cyber Sunset', color: '#f43f5e' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setThemeMenuOpen(false);
                }}
                style={{
                  background: theme === t.id ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  border: 'none',
                  color: theme === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontWeight: theme === t.id ? '600' : '400',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
              >
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.color, display: 'inline-block' }} />
                {t.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
