import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn.js';

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
  className = '',
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';

  return (
    <div className={cn("flex flex-col gap-1.5 w-full mb-4", className)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-primary)] flex items-center">
          {label}
          {required && <span className="text-[var(--secondary)] ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-[var(--text-muted)] flex items-center justify-center pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={isPasswordField ? (showPassword ? 'text' : 'password') : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex w-full rounded-lg border border-[var(--border)] bg-[var(--bg-dark)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-10",
            isPasswordField && "pr-10",
            error && "border-red-500 focus:ring-red-500/50 focus:border-red-500"
          )}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer flex items-center justify-center p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--text-muted)] mt-0.5">{hint}</p>}
    </div>
  );
}
