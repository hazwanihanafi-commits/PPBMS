// components/RemainingDaysBadge.jsx
import React from 'react';

function daysBetween(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diff = Math.floor((d - now) / (1000*60*60*24));
  return diff;
}

export default function RemainingDaysBadge({ due }) {
  const days = daysBetween(due);
  if (days === null) return <span className="text-sm text-gray-500">—</span>;
  if (days >= 0) {
    return <span className="remaining ontime">{days}d remaining</span>;
  } else {
    return <span className="remaining overdue">{Math.abs(days)}d overdue</span>;
  }
}
