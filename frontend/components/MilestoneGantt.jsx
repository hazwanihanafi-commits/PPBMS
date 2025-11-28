import React from 'react';

function dateToNum(d) {
  return d ? new Date(d + 'T00:00:00').getTime() : null;
}

export default function MilestoneGantt({ rows = [], width = 700, rowHeight = 22, gap = 18 }) {
  if (!rows || rows.length === 0) return null;

  const allDates = [];
  rows.forEach((r) => {
    if (r.start) allDates.push(dateToNum(r.start));
    if (r.expected) allDates.push(dateToNum(r.expected));
    if (r.actual) allDates.push(dateToNum(r.actual));
  });

  const minT = Math.min(...allDates);
  const maxT = Math.max(...allDates);

  const scaleX = (t) =>
    t == null
      ? 0
      : ((t - minT) / (maxT - minT)) * (width - 120) + 100;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${rows.length * (rowHeight + gap)}`}
      style={{ maxWidth: "100%" }}
    >
      <defs>
        <linearGradient id="grad-bar" x1="0" x2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>

        <linearGradient id="grad-bg" x1="0" x2="1">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#f3f4f6" />
        </linearGradient>
      </defs>

      {rows.map((r, i) => {
        const y = i * (rowHeight + gap) + 10;

        const s = dateToNum(r.start);
        const e = dateToNum(r.expected);
        const a = dateToNum(r.actual);

        const sx = scaleX(s);
        const ex = scaleX(e);
        const ax = scaleX(a);

        const barY = y + 12;

        return (
          <g key={r.milestone}>
            {/* Milestone definition label */}
            <text x="10" y={y} fontSize="12" fill="#333">
              {r.definition}
            </text>

            {/* background bar */}
            <rect
              x={sx}
              y={barY}
              width={Math.max(6, ex - sx)}
              height={10}
              rx={4}
              fill="url(#grad-bg)"
            />

            {/* progress bar */}
            {a && (
              <rect
                x={sx}
                y={barY}
                width={Math.max(6, ax - sx)}
                height={10}
                rx={4}
                fill="url(#grad-bar)"
              />
            )}

            {/* expected marker */}
            <circle
              cx={ex}
              cy={barY + 5}
              r={5}
              fill="#fff"
              stroke="#999"
              strokeWidth="1"
            />

            {/* actual marker */}
            {a && (
              <rect
                x={ax - 4}
                y={barY - 6}
                width={8}
                height={12}
                rx={2}
                fill="#7c3aed"
              />
            )}

            {/* expected date */}
            <text x={ex + 8} y={barY + 4} fontSize="11" fill="#666">
              {r.expected || "—"}
            </text>

            {/* actual date */}
            {r.actual && (
              <text x={ax + 8} y={barY + 4} fontSize="11" fill="#333">
                {r.actual}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
