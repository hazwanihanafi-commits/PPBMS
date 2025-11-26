// frontend/components/CircularMilestoneProgress.jsx
import { useEffect, useState } from "react";

export default function CircularMilestoneProgress({ completed = 0, total = 4, size = 120 }) {
  const pct = Math.round((completed / Math.max(total, 1)) * 100);
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  // color logic
  const color = pct >= 75 ? "text-green-500" : pct >= 50 ? "text-yellow-400" : pct >= 25 ? "text-orange-400" : "text-red-500";

  const [anim, setAnim] = useState(0);
  useEffect(() => {
    // simple animation
    let raf;
    const start = performance.now();
    const duration = 700;
    const tick = (t) => {
      const d = Math.min(1, (t - start) / duration);
      setAnim(d * pct);
      if (d < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const animatedDash = (anim / 100) * circumference;

  return (
    <div className="flex items-center space-x-4">
      <svg width={size} height={size} className="block">
        <defs>
          <linearGradient id="grad" x1="0" x2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          <circle
            r={radius}
            fill="none"
            stroke="url(#grad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${animatedDash} ${circumference - animatedDash}`}
            transform="rotate(-90)"
          />
          <text x="0" y="5" textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">
            {Math.round(anim)}%
          </text>
        </g>
      </svg>

      <div className="leading-tight">
        <div className={`text-lg font-semibold ${color}`}>{completed} / {total}</div>
        <div className="text-sm text-gray-500">milestones</div>
      </div>
    </div>
  );
}
