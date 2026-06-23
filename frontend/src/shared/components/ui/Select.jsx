import React from 'react';
import { cn } from '../../utils/cn.js';

export default function Select({ label, value, onChange, options = [], disabled = false, required = false, name, className = '' }) {
  return (
    <div className={cn("flex flex-col gap-1.5 w-full mb-4", className)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-primary)] flex items-center">
          {label}
          {required && <span className="text-[var(--secondary)] ml-1">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="flex w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1.25rem 1.25rem',
          backgroundRepeat: 'no-repeat',
          paddingRight: '2.5rem'
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--bg-darker)] text-[var(--text-primary)]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
