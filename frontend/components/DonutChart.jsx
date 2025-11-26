// components/DonutChart.jsx
export default function DonutChart({ percentage = 0, size = 160 }) {
  // clamp
  const pct = Math.max(0, Math.min(100, percentage));
  const radius = (size / 2) - 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  // gradient id must be unique in page — use static id (should be safe here)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B721FF" />
          <stop offset="50%" stopColor="#21D4FD" />
          <stop offset="100%" stopColor="#FF5F6D" />
        </linearGradient>
      </defs>

      {/* background ring */}
      <g transform={`translate(${size/2}, ${size/2})`}>
        <circle r={radius} fill="none" stroke="#f0f0f0" strokeWidth="14" />

        {/* colored arc */}
        <circle
          r={radius}
          fill="none"
          stroke="url(#grad1)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(-90)"
        />

        {/* center text */}
        <text
          x="0"
          y="4"
          textAnchor="middle"
          className="font-semibold"
          style={{ fontSize: Math.max(12, size * 0.15) }}
          fill="#111827"
        >
          {pct}%
        </text>
      </g>
    </svg>
  );
}
