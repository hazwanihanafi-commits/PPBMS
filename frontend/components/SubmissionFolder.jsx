// components/SubmissionFolder.jsx
export default function SubmissionFolder({ raw = {} }) {
  // map expected document headers to nicer labels
  const docs = [
    { key: "Submission Document P1", label: "P1 Document" },
    { key: "Submission Document P3", label: "P3 Document" },
    { key: "Submission Document P4", label: "P4 Document" },
    { key: "Submission Document P5", label: "P5 Document" },
    // additional docs (if stored)
    { key: "Thesis Draft Document", label: "Thesis Draft" },
    { key: "Ethics Document", label: "Ethics Clearance" },
  ];

  return (
    <div className="space-y-2">
      {docs.map((d) => {
        const url = raw?.[d.key] || "";
        return (
          <div key={d.key} className="flex items-center justify-between border rounded p-3">
            <div>
              <div className="font-medium">{d.label}</div>
              <div className="text-xs text-gray-500">{url ? "Uploaded" : "No file"}</div>
            </div>

            <div className="flex items-center gap-3">
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" className="text-sm text-purple-600 hover:underline">
                  Open
                </a>
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
              <a href="/student/me" className="px-3 py-1 bg-purple-600 text-white rounded text-sm">Upload</a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
