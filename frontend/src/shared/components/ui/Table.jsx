import React from 'react';
import EmptyState from './EmptyState.jsx';

export default function Table({ columns = [], rows = [], emptyMessage = 'No records found.' }) {
  if (rows.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
