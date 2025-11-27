// components/DonutChart.jsx
import React from 'react';

export default function DonutChart({ percentage = 0, size = 140 }) {
  const r = (size / 2) - 10;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, percentage));
  const dash = (c * filled) / 100;
  const gap = c - dash;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="donutGradient" x1="0" x2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>
      <g transform={`translate(${size/2},${size/2})`}>
        <circle r={r} fill="none" stroke="#edf2f7" strokeWidth="14" />
        <circle r={r} fill="none" stroke="url(#donutGradient)" strokeWidth="14"
          strokeDasharray={`${dash} ${gap}`} strokeLinecap="round" transform="rotate(-90)" />
        <text x="0" y="6" textAnchor="middle" fontSize="20" fontWeight="600" fill="#111">
          {percentage}%
        </text>
      </g>
    </svg>
  );
}
