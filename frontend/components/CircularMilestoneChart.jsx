// components/CircularMilestoneChart.jsx
import React from "react";

export default function CircularMilestoneChart({ completed, total }) {
  const percent = Math.round((completed / total) * 100);
  const stroke = 6;
  const radius = 40;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg height={100} width={100}>
        <circle
          stroke="#eee"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx="50"
          cy="50"
        />
        <circle
          stroke="#7c3aed"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx="50"
          cy="50"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>

      <p className="mt-2 text-lg font-semibold text-purple-700">
        {percent}%
      </p>
    </div>
  );
}
