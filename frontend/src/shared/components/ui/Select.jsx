import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({ label, value, onChange, options = [], disabled = false, required = false, name }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange({ target: { name, value: val } });
    setIsOpen(false);
  };

  return (
    <div className={label ? "form-group" : ""} ref={containerRef} style={{ position: 'relative' }}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span style={{ color: 'var(--secondary)', marginLeft: 4 }}>*</span>}
        </label>
      )}
      
      {/* Dropdown Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="form-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          textAlign: 'left',
          position: 'relative',
          paddingRight: '2.5rem',
          borderColor: isOpen ? 'var(--border-focus)' : 'var(--border)',
          boxShadow: isOpen ? '0 0 10px var(--primary-glow)' : 'none',
          backgroundColor: 'var(--bg-darker)',
          minHeight: '42px',
        }}
      >
        <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            position: 'absolute',
            right: '1rem',
            transition: 'transform 0.2s ease', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-secondary)'
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.5rem',
            background: 'var(--bg-dark)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            zIndex: 999,
            maxHeight: '260px',
            overflowY: 'auto',
            backdropFilter: 'blur(10px)',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                  background: isSelected ? 'rgba(20, 241, 149, 0.1)' : 'transparent',
                  transition: 'all 0.15s ease',
                  borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: isSelected ? '600' : '400',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
