import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleAction = () => {
    navigate(isAuthenticated ? '/dashboard' : '/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-darker)',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow blobs */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(0,227,122,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Large 404 */}
      <div
        aria-hidden="true"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(7rem, 20vw, 14rem)',
          fontWeight: 700,
          color: 'var(--primary)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          opacity: 0.15,
          position: 'absolute',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        404
      </div>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 480,
        }}
      >
        {/* Visible 404 badge */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(4rem, 12vw, 7rem)',
            fontWeight: 700,
            color: 'var(--primary)',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            filter: 'drop-shadow(0 0 32px var(--primary-glow))',
          }}
        >
          404
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Page not found
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          The page you're looking for doesn't exist or has moved.
        </p>

        <Button onClick={handleAction} variant="primary">
          {isAuthenticated ? 'Back to dashboard' : 'Back to homepage'}
        </Button>
      </div>

      {/* Decorative bottom line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background:
            'linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)',
          opacity: 0.3,
        }}
      />
    </div>
  );
}
