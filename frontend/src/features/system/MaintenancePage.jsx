import React from 'react';

export default function MaintenancePage() {
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
      {/* Ambient gradient layers */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,176,32,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(0,227,122,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

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
        {/* Pulsing wrench icon container */}
        <div
          style={{
            position: 'relative',
            marginBottom: '2rem',
          }}
        >
          {/* Outer pulsing ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-20px',
              borderRadius: '50%',
              border: '2px solid var(--accent-warning)',
              opacity: 0.3,
              animation: 'maintenancePulseOuter 2.4s ease-in-out infinite',
            }}
          />
          {/* Middle pulsing ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              border: '1.5px solid var(--accent-warning)',
              opacity: 0.5,
              animation: 'maintenancePulseMid 2.4s ease-in-out infinite 0.4s',
            }}
          />
          {/* Icon circle */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: 'rgba(255, 176, 32, 0.12)',
              border: '2px solid var(--accent-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              boxShadow: '0 0 40px rgba(255,176,32,0.2)',
              animation: 'maintenanceWrenchRock 3s ease-in-out infinite',
            }}
          >
            🔧
          </div>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em',
          }}
        >
          We'll be right back
        </h1>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 176, 32, 0.1)',
            border: '1px solid rgba(255, 176, 32, 0.3)',
            borderRadius: '20px',
            padding: '0.4rem 1rem',
            marginBottom: '1.25rem',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--accent-warning)',
              display: 'inline-block',
              animation: 'maintenanceDot 1.5s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--accent-warning)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Scheduled Maintenance
          </span>
        </div>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            lineHeight: 1.75,
            maxWidth: 420,
          }}
        >
          iDubbl is undergoing scheduled maintenance.{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            Matches and withdrawals are paused.
          </span>{' '}
          We'll be back shortly.
        </p>

        {/* Progress bar decoration */}
        <div
          style={{
            marginTop: '3rem',
            width: '100%',
            maxWidth: 360,
            height: 4,
            borderRadius: '2px',
            background: 'var(--border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: '2px',
              background:
                'linear-gradient(90deg, var(--accent-warning), var(--primary))',
              animation: 'maintenanceProgress 2.5s ease-in-out infinite',
            }}
          />
        </div>
        <p
          style={{
            marginTop: '0.75rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.02em',
          }}
        >
          Hang tight, we're working on it
        </p>
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
            'linear-gradient(90deg, transparent 0%, var(--accent-warning) 50%, transparent 100%)',
          opacity: 0.4,
        }}
      />

      <style>{`
        @keyframes maintenancePulseOuter {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50%       { transform: scale(1.12); opacity: 0.45; }
        }
        @keyframes maintenancePulseMid {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50%       { transform: scale(1.08); opacity: 0.65; }
        }
        @keyframes maintenanceWrenchRock {
          0%, 100% { transform: rotate(-8deg); }
          50%       { transform: rotate(8deg); }
        }
        @keyframes maintenanceDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes maintenanceProgress {
          0%   { width: 0%; }
          60%  { width: 80%; }
          100% { width: 0%; }
        }
      `}</style>
    </div>
  );
}
