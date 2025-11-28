import React from "react";

function toTime(d) {
  if (!d) return null;
  // Try to parse timestamp-like strings (Google Sheets), or date-only
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return parsed.getTime();
}

function formatMonthYear(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: "short", year: "numeric" });
}

export default function MilestoneGantt({ rows = [], width = 900, rowHeight = 28, gap = 24 }) {
  if (!rows || rows.length === 0) return null;

  // collect all dates
  const times = [];
  rows.forEach(r => {
    const s = toTime(r.start);
    const e = toTime(r.expected);
    const a = toTime(r.actual);
    if (s) times.push(s);
    if (e) times.push(e);
    if (a) times.push(a);
  });
  if (times.length === 0) return null;

  const minT = Math.min(...times);
  const maxT = Math.max(...times);

  // layout constants
  const leftLabelWidth = 220;   // room for milestone definition text
  const topHeader = 34;         // header area for month labels
  const paddingRight = 40;
  const chartWidth = Math.max(300, width - leftLabelWidth - paddingRight);

  const scaleX = (t) => {
    if (!t) return leftLabelWidth;
    return leftLabelWidth + ((t - minT) / (maxT - minT)) * chartWidth;
  };

  // Build month ticks between minT and maxT
  const months = [];
  const start = new Date(minT);
  start.setDate(1);
  start.setHours(0,0,0,0);
  let cursor = start.getTime();
  while (cursor <= maxT + 1000*60*60*24) {
    months.push(cursor);
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + 1);
    cursor = d.getTime();
  }

  const svgHeight = topHeader + rows.length * (rowHeight + gap) + 20;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${svgHeight}`} style={{ maxWidth: '100%' }}>
      <defs>
        <linearGradient id="gradBar" x1="0" x2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id="gradBg" x1="0" x2="1">
          <stop offset="0%" stopColor="#eef2ff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
      </defs>

      {/* Month header band */}
      <rect x={leftLabelWidth} y={4} width={chartWidth} height={topHeader - 8} rx={6} fill="#fff" />
      {months.map(m => {
        const x = scaleX(m);
        return (
          <g key={m}>
            <line x1={x} x2={x} y1={4} y2={svgHeight - 6} stroke="#eef0f4" strokeWidth="1" />
            <text x={x + 6} y={topHeader - 12} fontSize="11" fill="#6b7280">{formatMonthYear(m)}</text>
          </g>
        );
      })}

      {rows.map((r, i) => {
        const rowY = topHeader + i * (rowHeight + gap) + 10;

        const s = toTime(r.start);
        const e = toTime(r.expected);
        const a = toTime(r.actual);

        const sx = s ? scaleX(s) : leftLabelWidth;
        const ex = e ? scaleX(e) : sx + Math.max(24, chartWidth * 0.05);
        const ax = a ? scaleX(a) : null;

        const barHeight = Math.min(14, rowHeight - 6);
        const barY = rowY + (rowHeight - barHeight) / 2;

        return (
          <g key={r.milestone || i}>
            {/* Milestone left label — wrap if long by splitting on " — " or showing definition */}
            <text x={12} y={rowY + 8} fontSize="13" fill="#2c2c2c" fontWeight="600">
              {r.definition || r.milestone}
            </text>

            {/* background track */}
            <rect x={sx} y={barY} width={Math.max(8, ex - sx)} height={barHeight} rx={8} fill="url(#gradBg)" />

            {/* progress overlay */}
            {ax && ax > sx && (
              <rect x={sx} y={barY} width={Math.max(6, ax - sx)} height={barHeight} rx={8} fill="url(#gradBar)" />
            )}

            {/* expected marker */}
            {e && <circle cx={ex} cy={barY + barHeight/2} r={5} fill="#fff" stroke="#bdbdbd" strokeWidth="1" />}

            {/* actual marker */}
            {ax && <rect x={ax - 5} y={barY - 4} width={10} height={barHeight + 8} rx={3} fill="#7c3aed" />}

            {/* date labels positioned to right of markers */}
            {e && <text x={ex + 8} y={barY + barHeight/2 + 4} fontSize="11" fill="#6b7280">{r.expected ? String(r.expected).split('T')[0] : '—'}</text>}
            {a && ax && <text x={ax + 8} y={barY + barHeight/2 + 4} fontSize="11" fill="#111827">{String(r.actual).split('T')[0]}</text>}
          </g>
        );
      })}
    </svg>
  );
}
