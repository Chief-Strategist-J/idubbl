import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h2 className="page-header-title">{title}</h2>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}
