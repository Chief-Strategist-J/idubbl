import React from 'react';

export default function Card({ children, className = '', padding = true, hover = true, style = {} }) {
  return (
    <div
      className={`glass-card ${className}`}
      style={{ padding: padding ? undefined : 0, ...style }}
    >
      {children}
    </div>
  );
}
