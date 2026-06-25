import React from 'react';
import { Button } from '../../shared/components/ui/index.js';

export default function ErrorPage() {
  const handleRetry = () => {
    window.location.reload();
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
      {/* Ambient red glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,77,79,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Large background 500 */}
      <div
        aria-hidden="true"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(7rem, 20vw, 14rem)',
          fontWeight: 700,
          color: 'var(--accent-red)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          opacity: 0.1,
          position: 'absolute',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        500
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
          maxWidth: 520,
        }}
      >
        {/* Visible 500 */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(4rem, 12vw, 7rem)',
            fontWeight: 700,
            color: 'var(--accent-red)',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            filter: 'drop-shadow(0 0 32px rgba(255,77,79,0.4))',
          }}
        >
          500
        </div>

        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--accent-red-glow)',
            border: '2px solid var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            marginBottom: '1.25rem',
          }}
        >
          ⚠️
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
            lineHeight: 1.3,
          }}
        >
          Something went wrong on our end
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            maxWidth: 380,
          }}
        >
          Try again in a moment. If this keeps happening, contact support.
        </p>

        <Button onClick={handleRetry} variant="primary">
          Try again
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
            'linear-gradient(90deg, transparent 0%, var(--accent-red) 50%, transparent 100%)',
          opacity: 0.3,
        }}
      />
    </div>
  );
}
