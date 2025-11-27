// components/DonutChart.jsx
import { useMemo } from "react";

export default function DonutChart({ percentage = 0, size = 140 }) {
  const stroke = size * 0.12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = useMemo(() => circumference * (1 - percentage / 100), [circumference, percentage]);

  // gradient id must be unique per page (but one is fine)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <defs>
        <linearGradient id="donutGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#7b2ff7" />
          <stop offset="40%" stopColor="#b03ad6" />
          <stop offset="70%" stopColor="#ff6b3d" />
        </linearGradient>
      </defs>

      {/* background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#eef2f5"
        strokeWidth={stroke}
        fill="none"
      />

      {/* progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#donutGrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        fill="none"
      />

      {/* center percentage */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="font-semibold"
        style={{ fontSize: Math.round(size / 6) }}
        fill="#1f2937"
      >
        {percentage}%
      </text>
    </svg>
  );
}
