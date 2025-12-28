export default function CompletionDonut({ percent }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex items-center gap-6 mb-6">
      <svg width="120" height="120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="#7C3AED"
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="text-lg font-bold fill-purple-700"
        >
          {percent}%
        </text>
      </svg>

      <div>
        <div className="text-sm text-gray-600">Overall Completion</div>
        <div className="text-lg font-semibold text-purple-800">
          {percent}% Completed
        </div>
      </div>
    </div>
  );
}
