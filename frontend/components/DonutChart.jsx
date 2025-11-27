// components/DonutChart.jsx
import React from "react";

/**
 * DonutChart - SVG donut with gradient stroke.
 * props:
 *  - percentage (0..100)
 *  - size (px)
 */
export default function DonutChart({ percentage = 0, size = 160 }) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (percentage / 100) * circumference;
  const gap = circumference - dash;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="gradDonut" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" /> {/* purple */}
          <stop offset="50%" stopColor="#EC4899" /> {/* pink */}
          <stop offset="100%" stopColor="#FB923C" /> {/* orange */}
        </linearGradient>
      </defs>

      {/* background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#eef2f7"
        strokeWidth={stroke}
        fill="none"
      />

      {/* progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#gradDonut)"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${dash} ${gap}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />

      {/* center % text */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.16}
        fontWeight="700"
        fill="#1f2937"
      >
        {percentage}%
      </text>
    </svg>
  );
}
