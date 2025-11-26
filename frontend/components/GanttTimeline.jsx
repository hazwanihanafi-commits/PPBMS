// components/GanttTimeline.jsx
import React from "react";
import { parseISO, differenceInDays } from "date-fns";

export default function GanttTimeline({ raw, dueDates }) {
  const milestones = Object.keys(dueDates).map((label) => {
    const due = parseISO(dueDates[label]);
    const submitted = raw[label];

    return {
      label,
      due,
      submitted: submitted ? parseISO(submitted) : null,
      late:
        submitted && differenceInDays(submitted, due) > 0
          ? differenceInDays(submitted, due)
          : 0,
    };
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-xl font-semibold mb-4">Gantt Timeline</h3>

      <div className="space-y-4">
        {milestones.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-sm mb-1">
              <span>{m.label}</span>
              <span className="text-gray-500">
                Due: {m.due.toISOString().slice(0, 10)}
              </span>
            </div>

            <div className="w-full h-3 bg-gray-200 rounded-lg relative">
              <div
                className={`h-3 rounded-lg ${
                  m.submitted ? "bg-purple-500" : "bg-gray-400"
                }`}
                style={{
                  width: `${m.submitted ? 100 : 40}%`,
                }}
              />

              {m.late > 0 && (
                <span className="absolute right-0 top-[-20px] text-xs text-red-600">
                  +{m.late} days late
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
