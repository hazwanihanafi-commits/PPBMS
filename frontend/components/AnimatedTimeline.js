// frontend/components/AnimatedTimeline.js
import React from "react";

/**
 * AnimatedVerticalTimeline
 * Props:
 *   raw: object (spreadsheet row), e.g. raw["P1 Submitted"] = "2025-01-05"
 *   dueDates: optional map { "P4 Submitted": "2025-02-15", ... } to detect lateness
 *
 * Usage:
 *  <AnimatedVerticalTimeline raw={row.raw} dueDates={DUE_MAP} />
 */

const ICONS = {
  "P1 Submitted": "📝",
  "P1 Approved": "✅",
  "P3 Submitted": "📝",
  "P3 Approved": "✅",
  "P4 Submitted": "📝",
  "P4 Approved": "✅",
  "P5 Submitted": "📤",
  "P5 Approved": "✅",
};

const ORDER = [
  "P1 Submitted",
  "P1 Approved",
  "P3 Submitted",
  "P3 Approved",
  "P4 Submitted",
  "P4 Approved",
  "P5 Submitted",
  "P5 Approved",
];

function isLate(dateStr, dueStr) {
  if (!dateStr || !dueStr) return false;
  try {
    const d = new Date(dateStr);
    const due = new Date(dueStr);
    return d > due;
  } catch {
    return false;
  }
}

export default function AnimatedVerticalTimeline({ raw = {}, dueDates = {} }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Milestone Timeline</h3>

      <div className="relative pl-8">
        {/* vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="flex flex-col gap-6">
          {ORDER.map((key, i) => {
            const val = raw[key];
            const done = !!(val && String(val).trim().length);
            const due = dueDates[key];
            const late = done && isLate(val, due);
            return (
              <div key={key} className="relative">
                {/* dot + icon */}
                <div
                  className={`absolute -left-8 top-0 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow ${
                    done ? "bg-green-500 text-white" : "bg-white text-gray-600 border"
                  } transition-transform transform hover:scale-110`}
                  style={{ boxShadow: "0 6px 18px rgba(16,24,40,0.08)" }}
                >
                  <span>{ICONS[key] || "🔹"}</span>
                </div>

                {/* content box */}
                <div
                  className={`ml-6 pl-4 pr-4 py-2 rounded-lg border ${done ? "bg-green-50 border-green-100" : "bg-white border-gray-100"}`}
                  style={{ transition: "all .25s ease" }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-md font-semibold">{key}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {done ? (
                          <span className="font-medium text-gray-800">Date: {val}</span>
                        ) : (
                          <span className="italic text-gray-400">Not completed</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {done ? (
                        <>
                          <div className="text-sm text-green-700 font-semibold">Completed</div>
                          {late && (
                            <div className="mt-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              Late
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* show due date if available */}
                          {due ? (
                            <div className="text-sm text-gray-500">
                              Due: <span className="font-medium">{due}</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">No date</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
