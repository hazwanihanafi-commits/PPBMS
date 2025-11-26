// frontend/components/CircularMilestoneChart.jsx
export default function CircularMilestoneChart({ percentage = 0 }) {
  // simple SVG donut with gradient
  const radius = 48;
  const stroke = 12;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.min(100, percentage) / 100);

  return (
    <div className="flex items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#6ee7b7"/>
            <stop offset="50%" stopColor="#60a5fa"/>
            <stop offset="100%" stopColor="#7c3aed"/>
          </linearGradient>
        </defs>

        <g transform="translate(70,70)">
          <circle r={radius} stroke="#f3f4f6" strokeWidth={stroke} fill="none" />
          <circle r={radius} stroke="url(#g1)" strokeWidth={stroke} strokeLinecap="round"
                  fill="none" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
                  transform="rotate(-90)" />
          <text x="0" y="6" textAnchor="middle" fontSize="22" fontWeight="700" fill="#111827">
            {percentage}%
          </text>
        </g>
      </svg>
    </div>
  );
}
