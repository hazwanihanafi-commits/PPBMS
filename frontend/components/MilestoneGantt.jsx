// components/MilestoneGantt.jsx
import React from 'react';

/*
props:
  rows: [{ milestone:'P1', start:'2024-02-01', expected:'2024-08-31', actual:'2024-08-30' }, ...]
  width / height optional
*/

function dateToNum(d) {
  return d ? new Date(d + 'T00:00:00').getTime() : null;
}

export default function MilestoneGantt({ rows = [], width = 700, rowHeight = 18, gap = 14 }) {
  if (!rows || rows.length === 0) return null;

  // compute global timeline min/max
  const allDates = [];
  rows.forEach(r => {
    if (r.start) allDates.push(dateToNum(r.start));
    if (r.expected) allDates.push(dateToNum(r.expected));
    if (r.actual) allDates.push(dateToNum(r.actual));
  });

  const minT = Math.min(...allDates) || Date.now();
  const maxT = Math.max(...allDates) || (minT + 1000*60*60*24*100);

  const viewWidth = width;
  const h = rows.length * (rowHeight + gap);

  const scaleX = (t) => {
    if (!t) return 0;
    return Math.max(4, Math.min(viewWidth - 40, ((t - minT) / (maxT - minT)) * (viewWidth - 80) + 20));
  };

  return (
    <svg width="100%" viewBox={`0 0 ${viewWidth} ${h}`} style={{maxWidth:'100%'}}>
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id="g2" x1="0" x2="1">
          <stop offset="0%" stopColor="#e6e9ee"/>
          <stop offset="100%" stopColor="#f6f7f9"/>
        </linearGradient>
      </defs>

      {rows.map((r, i) => {
        const y = i * (rowHeight + gap) + 8;
        const sx = scaleX(dateToNum(r.start));
        const ex = scaleX(dateToNum(r.expected));
        const ax = scaleX(dateToNum(r.actual));
        const barY = y + (rowHeight / 3);
        const barHeight = rowHeight / 2;

        // compute progress ratio between start and expected for actual
        const total = dateToNum(r.expected) && dateToNum(r.start) ? dateToNum(r.expected) - dateToNum(r.start) : 1;
        const actLen = dateToNum(r.actual) ? Math.max(0, dateToNum(r.actual) - dateToNum(r.start)) : 0;
        const progressLenPx = total ? ((actLen / total) * (ex - sx)) : 0;

        return (
          <g key={r.milestone}>
            {/* label */}
            <text x="4" y={y + 12} fontSize="12" fill="#222">{r.milestone}</text>

            {/* background track */}
            <rect x={sx} y={barY} width={Math.max(4, ex - sx)} height={barHeight} rx={8} fill="url(#g2)" />

            {/* progress gradient overlay */}
            {r.actual && (
              <rect x={sx} y={barY} width={Math.max(4, progressLenPx)} height={barHeight} rx={8} fill="url(#g1)" />
            )}

            {/* expected marker */}
            <circle cx={ex} cy={barY + barHeight/2} r={6} fill="#fff" stroke="#b3b3b3" strokeWidth="1" />

            {/* actual marker */}
            {r.actual && (
              <rect x={ax - 6} y={barY - 8} width={12} height={12} rx={3} fill="#7c3aed" />
            )}

            {/* small text of expected and actual near end */}
            <text x={ex + 8} y={barY + 4} fontSize="11" fill="#666">
              {r.expected ? r.expected : '—'}
            </text>
            {r.actual && <text x={ax + 8} y={barY + 4} fontSize="11" fill="#333">{r.actual}</text>}
          </g>
        );
      })}
    </svg>
  );
}
