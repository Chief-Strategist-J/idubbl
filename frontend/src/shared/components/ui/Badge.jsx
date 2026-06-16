import React from 'react';

const STATUS_MAP = {
  pending:   { className: 'badge pending', label: 'Pending' },
  approved:  { className: 'badge approved', label: 'Approved' },
  rejected:  { className: 'badge rejected', label: 'Rejected' },
  active:    { className: 'badge approved', label: 'Active' },
  completed: { className: 'badge approved', label: 'Completed' },
  suspended: { className: 'badge rejected', label: 'Suspended' },
  paid:      { className: 'badge approved', label: 'Paid' },
  failed:    { className: 'badge rejected', label: 'Failed' },
  searching: { className: 'badge pending', label: 'Searching' },
  win:       { className: 'badge approved', label: 'Win' },
  loss:      { className: 'badge rejected', label: 'Loss' },
};

export default function Badge({ status, label }) {
  const config = STATUS_MAP[status] || { className: 'badge', label: status };
  return <span className={config.className}>{label || config.label}</span>;
}
