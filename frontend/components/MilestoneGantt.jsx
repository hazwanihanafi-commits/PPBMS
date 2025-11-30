// frontend/components/MilestoneGantt.jsx
import React from "react";

function dateToNum(d) {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed)) {
    // try yyyy-mm-dd text
    const tryIso = new Date(d + "T00:00:00");
    if (isNaN(tryIso)) return null;
    return tryIso.getTime();
  }
  return parsed.getTime();
}

function formatMonth(t) {
  const d = new Date(t);
  return d.toLocaleString(undefined, { month: "short", year: "numeric" });
}

export default function MilestoneGantt({ rows = [], width = 900, rowHeight = 28, gap = 18 }) {
  if (!rows || rows.length === 0) return null;

  const allDates = [];
  rows.forEach(r => {
    if (r.start) allDates.push(dateToNum(r.start));
    if (r.expected) allDates.push(dateToNum(r.expected));
    if (r.actual) allDates.push(dateToNum(r.actual));
  });

  if (allDates.length === 0) {
    // fallback to today +/- months
    const now = Date.now();
    allDates.push(now - 1000*60*60*24*180);
    allDates.push(now + 1000*60*60*24*180);
  }

  const minT = Math.min(...allDates);
  const maxT = Math.max(...allDates);
  const paddingLeft = 140;
  const paddingRight = 40;
  const chartWidth = width - paddingLeft - paddingRight;

  const scaleX = (t) => {
    if (!t) return paddingLeft;
    return paddingLeft + ((t - minT) / Math.max(1, (maxT - minT))) * chartWidth;
  };

  // build month ticks
  const months = [];
  const startMonth = new Date(minT);
  startMonth.setDate(1);
  let cursor = startMonth.getTime();
  while (cursor < maxT + 1000*60*60*24*31) {
    months.push(cursor);
    const c = new Date(cursor);
    c.setMonth(c.getMonth() + 1);
    cursor = c.getTime();
  }

  const svgHeight = rows.length * (rowHeight + gap) + 60;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${svgHeight}`} style={{ maxWidth: "100%" }}>
      <defs>
        <linearGradient id="gBar" x1="0" x2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id="gBg" x1="0" x2="1">
          <stop offset="0%" stopColor="#eef2ff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
      </defs>

      {/* months gridlines */}
      {months.map((m) => {
        const x = scaleX(m);
        return (
          <g key={m}>
            <line x1={x} x2={x} y1={28} y2={svgHeight - 10} stroke="#eef0f4" strokeWidth="1" />
            <text x={x + 4} y={20} fontSize="11" fill="#9aa0a6">{formatMonth(m)}</text>
          </g>
        );
      })}

      {rows.map((r, i) => {
        const y = i * (rowHeight + gap) + 48;
        const s = dateToNum(r.start);
        const e = dateToNum(r.expected);
        const a = dateToNum(r.actual);

        const sx = s ? scaleX(s) : paddingLeft;
        const ex = e ? scaleX(e) : sx + 40;
        const ax = a ? scaleX(a) : null;

        const barY = y - 6;
        return (
          <g key={i}>
            {/* left label */}
            <text x={12} y={y} fontSize="13" fill="#111827" fontWeight="600">
              {r.definition || r.activity || r.milestone}
            </text>

            {/* background bar */}
            <rect x={sx} y={barY} width={Math.max(8, ex - sx)} height={12} rx={6} fill="url(#gBg)" />

            {/* progress overlay */}
            {ax && (
              <rect x={sx} y={barY} width={Math.max(6, ax - sx)} height={12} rx={6} fill="url(#gBar)" />
            )}

            {/* expected marker */}
            {e && <circle cx={ex} cy={barY + 6} r={5} fill="#fff" stroke="#bdbdbd" strokeWidth="1" />}

            {/* actual marker */}
            {ax && <rect x={ax - 5} y={barY - 2} width={10} height={16} rx={3} fill="#7c3aed" />}

            {/* small labels */}
            {e && <text x={ex + 8} y={barY + 9} fontSize="11" fill="#6b7280">{r.expected}</text>}
            {a && <text x={ax + 8} y={barY + 9} fontSize="11" fill="#111827">{r.actual}</text>}
          </g>
        );
      })}
    </svg>
  );
}
