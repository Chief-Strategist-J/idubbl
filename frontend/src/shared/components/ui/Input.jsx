import React from 'react';

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  hint = '',
  disabled = false,
  required = false,
  name,
  icon,
}) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {required && <span style={{ color: 'var(--secondary)', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="form-input"
          style={{
            paddingLeft: icon ? 40 : undefined,
            borderColor: error ? 'rgba(239,68,68,0.6)' : undefined,
            opacity: disabled ? 0.6 : 1,
          }}
        />
      </div>
      {error && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{error}</p>}
      {hint && !error && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}
