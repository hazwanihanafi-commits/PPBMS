// components/DonutChart.jsx
import { useEffect, useRef } from "react";

export default function DonutChart({ percentage = 75, size = 160 }) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - (percentage / 100));
  const gradId = "gradDonut";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gradId} x1="0%" x2="100%">
          <stop offset="0%" stopColor="#7a39a6" />
          <stop offset="45%" stopColor="#ff4d78" />
          <stop offset="100%" stopColor="#ff7a3d" />
        </linearGradient>
      </defs>

      {/* background track */}
      <circle cx={size/2} cy={size/2} r={radius} stroke="#eef2f6" strokeWidth={stroke} fill="none" />

      {/* arc */}
      <circle
        cx={size/2} cy={size/2} r={radius}
        stroke={`url(#${gradId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />

      {/* center text */}
      <text x="50%" y="50%" textAnchor="middle" dy="6" style={{fontWeight:700, fontSize:22, fill:'#111'}}>{percentage}%</text>
    </svg>
  );
}
