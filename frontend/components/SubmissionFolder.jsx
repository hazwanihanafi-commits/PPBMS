import React from "react";

export default function SubmissionFolder({ raw = {} }) {
  // keys used in your sheet (update if different)
  const entries = [
    {
      id: "P1",
      dateKey: "Submission Date P1",
      viewKey: "Submission URL P1",
      editKey: "Submission Edit URL P1",
    },
    {
      id: "P3",
      dateKey: "Submission Date P3",
      viewKey: "Submission URL P3",
      editKey: "Submission Edit URL P3",
    },
    {
      id: "P4",
      dateKey: "Submission Date P4",
      viewKey: "Submission URL P4",
      editKey: "Submission Edit URL P4",
    },
    {
      id: "P5",
      dateKey: "Submission Date P5",
      viewKey: "Submission URL P5",
      editKey: "Submission Edit URL P5",
    },
  ];

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h4 className="font-semibold mb-3">Submission Folder</h4>

      <div className="space-y-3">
        {entries.map((e) => {
          const date = raw?.[e.dateKey] || "";
          const view = raw?.[e.viewKey] || "";
          const edit = raw?.[e.editKey] || "";

          return (
            <div key={e.id} className="p-3 border rounded-md flex justify-between items-center">
              <div>
                <div className="font-semibold">{e.id}</div>
                <div className="text-sm text-gray-600">{date || "Not submitted"}</div>
              </div>

              <div className="flex items-center gap-2">
                {view ? (
                  <a href={view} target="_blank" rel="noreferrer" className="text-sm px-3 py-1 bg-purple-50 text-purple-700 rounded">View</a>
                ) : (
                  <span className="text-sm text-gray-400 px-3">No file</span>
                )}

                {edit ? (
                  <a href={edit} target="_blank" rel="noreferrer" className="text-sm px-3 py-1 bg-gray-50 text-gray-700 rounded">Edit</a>
                ) : (
                  <span className="text-sm text-gray-400 px-3">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
