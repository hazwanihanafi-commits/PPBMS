const ITEMS = [
  {
    section: "Monitoring & Supervision",
    items: [
      "Development Plan & Learning Contract (DPLC)",
      "Student Supervision Logbook",
      "Annual Progress Review – Year 1",
      "Annual Progress Review – Year 2",
      "Annual Progress Review – Year 3 (Final Year)",
    ],
  },
  {
    section: "Ethics & Research Outputs",
    items: [
      "Ethics Approval",
      "Publication Acceptance",
      "Proof of Submission",
      "Conference Presentation",
    ],
  },
  {
    section: "Thesis & Viva",
    items: [
      "Thesis Notice",
      "Viva Report",
      "Correction Verification",
      "Final Thesis",
    ],
  },
];

export default function SupervisorChecklist({ documents = {} }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-purple-700">
        📄 Submitted Documents
      </h3>

      {ITEMS.map((group) => (
        <div
          key={group.section}
          className="bg-white border rounded-2xl p-5 shadow"
        >
          <h4 className="font-semibold mb-4">{group.section}</h4>

          <ul className="space-y-4">
            {group.items.map((label) => {
              const url = documents[label]; // ✅ NOW MATCHES BACKEND

              return (
                <li key={label} className="border-b pb-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium">
                      {url ? "✅" : "⬜"} {label}
                    </span>

                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 text-sm hover:underline"
                      >
                        View →
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Not submitted
                      </span>
                    )}
                  </div>

                  {/* ✅ SHOW ACTUAL URL */}
                  {url && (
                    <div className="mt-1 text-xs text-gray-500 break-all">
                      {url}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
