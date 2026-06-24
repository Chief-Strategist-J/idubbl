import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search...', style = {} }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <span style={{ 
        position: 'absolute', 
        left: 14, 
        top: 0, 
        bottom: 0, 
        display: 'flex', 
        alignItems: 'center', 
        color: 'var(--text-secondary)',
        pointerEvents: 'none'
      }}>
        <Search size={16} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input"
        style={{ paddingLeft: 42 }}
      />
    </div>
  );
}
