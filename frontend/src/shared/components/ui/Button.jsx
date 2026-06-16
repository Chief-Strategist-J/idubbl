import React from 'react';
import Spinner from './Spinner.jsx';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'nav-btn',
};

export default function Button({
  variant = 'primary',
  children,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  fullWidth = false,
}) {
  return (
    <button
      type={type}
      className={`${VARIANTS[variant] || VARIANTS.primary} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        opacity: disabled || loading ? 0.6 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : undefined,
      }}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
