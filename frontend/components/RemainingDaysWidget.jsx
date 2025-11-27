// components/RemainingDaysWidget.jsx
import { useMemo } from "react";

function remainingDays(expected) {
  if (!expected) return null;
  const now = new Date();
  const e = new Date(expected);
  if (isNaN(e)) return null;
  const diff = Math.ceil((e - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function RemainingDaysWidget({ milestones = [] }) {
  // pick the next expected milestone that hasn't passed or the nearest overdue
  const next = useMemo(() => {
    const withDays = milestones.map((m) => ({
      ...m,
      days: remainingDays(m.expected),
    })).filter(Boolean);

    if (!withDays || withDays.length === 0) return null;

    // prefer positive smallest days, otherwise smallest absolute overdue
    const future = withDays.filter((w) => w.days >= 0);
    if (future.length > 0) {
      future.sort((a, b) => a.days - b.days);
      return future[0];
    }
    withDays.sort((a, b) => Math.abs(a.days) - Math.abs(b.days));
    return withDays[0];
  }, [milestones]);

  if (!next) return null;

  const isOverdue = next.days < 0;
  const label = isOverdue ? `${Math.abs(next.days)}d overdue` : `${next.days}d remaining`;
  const color = isOverdue ? "bg-red-500" : (next.days <= 14 ? "bg-yellow-500" : "bg-green-500");

  return (
    <div className="fixed right-4 bottom-6 sm:right-8 sm:bottom-8 z-40">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-lg ${color}`}>
        <div className="text-sm font-semibold">{next.label}</div>
        <div className="text-xl font-bold">{label}</div>
      </div>
    </div>
  );
}
