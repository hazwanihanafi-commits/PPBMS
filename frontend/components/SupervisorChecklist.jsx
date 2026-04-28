import { useState } from "react";
import { authFetch } from "../utils/authFetch";
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
export default function SupervisorChecklist({
  documents = {},
  studentEmail,
  onUpdated,
}) {
  const [feedbacks, setFeedbacks] = useState({});
  async function updateDocument(
    documentName,
    status
  ) {
    try {
      await authFetch(
  "/api/supervisor/document-status",
        {
          method: "POST",
          body: JSON.stringify({
  studentEmail,
  document_key: documentName,
  status,
  feedback:
    feedbacks[documentName] || ""
}),
        }
      );
      alert("Document updated");
      if (onUpdated) {
        onUpdated();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update document");
    }
  }
  function badgeColor(status) {
    if (status === "Approved") {
      return "bg-green-100 text-green-700";
    }
    if (status === "Revision Required") {
      return "bg-red-100 text-red-700";
    }
    if (status === "Pending Review") {
      return "bg-yellow-100 text-yellow-700";
    }
    return "bg-gray-100 text-gray-600";
  }
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
          <h4 className="font-semibold mb-4">
            {group.section}
          </h4>
          <ul className="space-y-5">
            {group.items.map((label) => {
              const doc = documents[label];
         const url =
  typeof doc === "string"
    ? doc
    : doc?.url;
              const status =
                typeof doc === "object"
                  ? doc?.status ||
                    "Pending Review"
                  : url
                  ? "Pending Review"
                  : "Not Submitted";
              const feedback =
                typeof doc === "object"
                  ? doc?.feedback
                  : "";
              return (
                <li
                  key={label}
                  className="border rounded-xl p-4"
                >
                  {/* TOP */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {url ? "✅" : "⬜"} {label}
                      </p>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-600 text-sm hover:underline"
                        >
                          View Submitted Document →
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">
                          Not submitted
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </div>
                  {/* URL */}
                  {url && (
                    <div className="mt-2 text-xs text-gray-500 break-all">
                      {url}
                    </div>
                  )}
                  {/* FEEDBACK */}
                  {url && (
                    <div className="mt-4 space-y-3">
                      <textarea
                        rows={3}
                        placeholder="Supervisor feedback..."
                        value={
                          feedbacks[label] ??
                          feedback ??
                          ""
                        }
                        onChange={(e) =>
                          setFeedbacks({
                            ...feedbacks,
                            [label]:
                              e.target.value,
                          })
                        }
                        className="w-full border rounded-xl p-3 text-sm"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            updateDocument(
                              label,
                              "Approved"
                            )
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            updateDocument(
                              label,
                              "Revision Required"
                            )
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm"
                        >
                          Request Revision
                        </button>
                      </div>
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
