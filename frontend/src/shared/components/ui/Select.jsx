import React from 'react';

export default function Select({ label, value, onChange, options = [], disabled = false, required = false, name }) {
  return (
    <div className={label ? "form-group" : ""}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span style={{ color: 'var(--secondary)', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="form-input"
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-dark)' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
