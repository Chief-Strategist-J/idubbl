import React, { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9998,
      background: 'var(--accent-warning)',
      color: '#000',
      textAlign: 'center',
      padding: '0.5rem 1rem',
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      boxShadow: '0 2px 12px rgba(255,176,32,0.4)',
    }}>
      <span>📡</span>
      You're offline. Reconnecting…
    </div>
  );
}
