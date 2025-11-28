import React from "react";

export default function SubmissionFolder({ raw }) {
  if (!raw) return null;

  const submissionMap = [
    {
      key: "P1",
      label: "P1 – Development Plan & Learning Contract",
      date: raw["P1 Submitted"] || "",
      file: raw["Submission Document P1"] || "",
      approved: raw["P1 Approved"] || "",
    },
    {
      key: "P3",
      label: "P3 – Research Logbook (Daily/Weekly)",
      date: raw["P3 Submitted"] || "",
      file: raw["Submission Document P3"] || "",
      approved: raw["P3 Approved"] || "",
    },
    {
      key: "P4",
      label: "P4 – Monthly Portfolio Monitoring Form",
      date: raw["P4 Submitted"] || "",
      file: raw["Submission Document P4"] || "",
      approved: raw["P4 Approved"] || "",
    },
    {
      key: "P5",
      label: "P5 – Annual Portfolio Review (MSc/PhD)",
      date: raw["P5 Submitted"] || "",
      file: raw["Submission Document P5"] || "",
      approved: raw["P5 Approved"] || "",
    },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h3 className="text-xl font-semibold text-purple-700 mb-4">Submission Folder</h3>

      <div className="space-y-4">
        {submissionMap.map((item) => {
          const submitted = Boolean(item.date && String(item.date).trim().toLowerCase() !== "n/a");

          return (
            <div key={item.key} className="border-b pb-3 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold text-gray-800">{item.label}</div>
                <div className="text-sm text-gray-600">
                  Status: {submitted ? <span className="text-green-600 font-semibold">Submitted</span> : <span className="text-red-500 font-semibold">Not submitted</span>}
                </div>
                <div className="text-sm text-gray-600">Date: {item.date || "—"}</div>
                <div className="text-sm text-gray-600">Approved: {item.approved || "—"}</div>
              </div>

              <div className="mt-2 md:mt-0">
                {item.file ? (
                  <a href={item.file} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-medium">
                    📄 View Submission File
                  </a>
                ) : (
                  <div className="text-sm text-gray-400 italic">No file uploaded</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
