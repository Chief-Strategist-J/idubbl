import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '', style = {} }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-switch ${theme} ${className}`}
      style={style}
      aria-label="Toggle Theme"
    >
      <div className="theme-toggle-track">
        <Sun className="icon sun" size={12} />
        <Moon className="icon moon" size={12} />
        <div className="theme-toggle-thumb" />
      </div>
    </button>
  );
}
