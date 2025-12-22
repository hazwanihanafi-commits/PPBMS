// frontend/components/ProgrammePLOBarChart.jsx
import React from "react";

export default function ProgrammePLOBarChart({ programmePLO }) {
  if (!programmePLO || Object.keys(programmePLO).length === 0) {
    return <p className="text-sm italic text-gray-500">No PLO data.</p>;
  }

  const ploEntries = Object.entries(programmePLO); // ✅ convert object → array

  return (
    <div className="space-y-3">
      {ploEntries.map(([plo, data]) => {
        const percent = Math.min((data.average / 5) * 100, 100);

        return (
          <div key={plo}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{plo}</span>
              <span>
                {data.average} ({data.status})
              </span>
            </div>

            <div className="w-full bg-gray-200 h-3 rounded-full">
              <div
                className={`h-3 rounded-full ${
                  data.status === "Achieved"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
