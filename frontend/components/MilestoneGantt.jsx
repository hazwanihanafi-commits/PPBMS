import React from "react";

function toTime(d) {
  if (!d) return null;
  const s = String(d).trim();
  // Accept many formats; Date will parse ISO or "YYYY-MM-DD HH:MM:SS"
  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) return null;
  return parsed.getTime();
}
function fmtDateShort(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toISOString().split("T")[0];
}
function formatMonthYear(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: "short", year: "numeric" });
}

export default function MilestoneGantt({ rows = [], width = 900, rowHeight = 30, gap = 20 }) {
  if (!rows || rows.length === 0) return null;

  // collect times
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

  const leftLabelWidth = 260;
  const topHeader = 36;
  const paddingRight = 40;
  const chartWidth = Math.max(320, width - leftLabelWidth - paddingRight);

  const scaleX = (t) => (t == null ? leftLabelWidth : leftLabelWidth + ((t - minT) / (maxT - minT)) * chartWidth);

  // months ticks
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

      {/* month header + gridlines */}
      <rect x={leftLabelWidth} y={6} width={chartWidth} height={topHeader - 8} rx={6} fill="#fff" />
      {months.map(m => {
        const x = scaleX(m);
        return (
          <g key={m}>
            <line x1={x} x2={x} y1={6} y2={svgHeight - 6} stroke="#eef0f4" strokeWidth="1" />
            <text x={x + 6} y={topHeader - 12} fontSize="11" fill="#6b7280">{formatMonthYear(m)}</text>
          </g>
        );
      })}

      {rows.map((r, i) => {
        const rowY = topHeader + i * (rowHeight + gap) + 8;
        const s = toTime(r.start);
        const e = toTime(r.expected);
        const a = toTime(r.actual);

        const sx = s ? scaleX(s) : leftLabelWidth;
        const ex = e ? scaleX(e) : sx + Math.max(24, chartWidth * 0.05);
        const ax = a ? scaleX(a) : null;

        const barHeight = Math.min(16, rowHeight - 8);
        const barY = rowY + (rowHeight - barHeight) / 2;

        return (
          <g key={`${r.activity}-${i}`}>
            {/* left label */}
            <text x={12} y={rowY + 8} fontSize="13" fill="#111827" fontWeight="600">{r.activity}</text>
            <text x={12} y={rowY + 22} fontSize="11" fill="#6b7280">{r.milestone} — {r.definition || ""}</text>

            {/* background track */}
            <rect x={sx} y={barY} width={Math.max(8, ex - sx)} height={barHeight} rx={8} fill="url(#gradBg)" />

            {/* actual overlay */}
            {ax && ax > sx && <rect x={sx} y={barY} width={Math.max(6, ax - sx)} height={barHeight} rx={8} fill="url(#gradBar)" />}

            {/* expected marker */}
            {e && <circle cx={ex} cy={barY + barHeight/2} r={5} fill="#fff" stroke="#bdbdbd" strokeWidth="1" />}

            {/* actual marker */}
            {ax && <rect x={ax - 5} y={barY - 4} width={10} height={barHeight + 8} rx={3} fill="#7c3aed" />}

            {/* small date labels */}
            {e && <text x={ex + 8} y={barY + barHeight/2 + 4} fontSize="11" fill="#6b7280">{fmtDateShort(e)}</text>}
            {a && ax && <text x={ax + 8} y={barY + barHeight/2 + 4} fontSize="11" fill="#111827">{fmtDateShort(a)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
