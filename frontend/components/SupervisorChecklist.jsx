import { useState } from "react";
import { authFetch } from "../utils/authFetch";

const MSC_ITEMS = [
  {
    section: "Monitoring & Supervision",
    items: [
      { name: "Development Plan & Learning Contract (DPLC)" },
      { name: "Student Supervision Logbook" },
      {
        name: "Annual Progress Review – Year 1",
        note: "Folder must contain Written Report and Presentation Slides"
      },
    ],
  },
  {
    section: "Ethics & Research Outputs",
    items: [
      { name: "Ethics Approval" },
      { name: "Publication Acceptance" },
      { name: "Proof of Submission" },
      { name: "Conference Presentation" },
    ],
  },
  {
    section: "Thesis & Viva",
    items: [
      { name: "Thesis Notice" },
      { name: "Correction Verification" },
      { name: "Final Thesis" },
    ],
  },
];

const PHD_ITEMS = [
  {
    section: "Monitoring & Supervision",
    items: [
      { name: "Development Plan & Learning Contract (DPLC)" },
      { name: "Student Supervision Logbook" },
      {
        name: "Annual Progress Review – Year 1",
        note: "Folder must contain Written Report and Presentation Slides"
      },
      {
        name: "Annual Progress Review – Year 2",
        note: "Folder must contain Written Report and Presentation Slides"
      },
      {
        name: "Annual Progress Review – Year 3 (Final Year)",
        note: "Folder must contain Written Report and Presentation Slides"
      },
    ],
  },
  {
    section: "Ethics & Research Outputs",
    items: [
      { name: "Ethics Approval" },
      { name: "Publication Acceptance" },
      { name: "Proof of Submission" },
      { name: "Conference Presentation" },
    ],
  },
  {
    section: "Thesis & Viva",
    items: [
      { name: "Thesis Notice" },
      { name: "Correction Verification" },
      { name: "Final Thesis" },
    ],
  },
];

export default function SupervisorChecklist({
  documents = {},
  studentEmail,
  programme = "",
  onUpdated,
}) {

  const programmeText = String(programme || "").toUpperCase();

const isMsc =
  programmeText.includes("MASTER") ||
  programmeText.includes("MSC") ||
  programmeText.includes("MASTER OF SCIENCE");

const ITEMS = isMsc ? MSC_ITEMS : PHD_ITEMS;

 const [feedbacks, setFeedbacks] = useState({});

  /* =====================================================
     UPDATE DOCUMENT
  ===================================================== */

  async function updateDocument(
    documentName,
    status
  ) {

    try {

      const feedback =
        feedbacks[documentName] || "";

      console.log(
        "SAVING:",
        documentName,
        status,
        feedback
      );

      await authFetch(
        "/api/supervisor/document-status",
        {
          method: "POST",

          body: JSON.stringify({

            studentEmail,

            documentName:
              documentName,

            status,

            feedback

          }),
        }
      );

      alert("Document updated");

      if (onUpdated) {
        onUpdated();
      }

    } catch (err) {

      console.error(err);

      alert(
        "Failed to update document"
      );
    }
  }

  /* =====================================================
     BADGE COLOR
  ===================================================== */

  function badgeColor(status) {

    if (status === "Approved") {
      return "bg-green-100 text-green-700";
    }

    if (
      status ===
      "Revision Required"
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      status ===
      "Pending Review"
    ) {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-gray-100 text-gray-600";
  }

  /* =====================================================
     UI
  ===================================================== */

  return (

    <div className="space-y-6">

      <h3 className="text-xl font-semibold text-purple-700">
        📄 Submitted Documents
      </h3>

      {ITEMS.map((group) => (

        <div
          key={group.section}
          className="
            bg-white
            border
            rounded-2xl
            p-5
            shadow
          "
        >

          <h4 className="font-semibold mb-4">
            {group.section}
          </h4>

          <ul className="space-y-5">

            {group.items.map((itemObj) => {

  const label =
    typeof itemObj === "string"
      ? itemObj
      : itemObj.name;

  const note =
    typeof itemObj === "object"
      ? itemObj.note
      : "";

              const doc =
                documents[label];

          console.log("LABEL:", label);
console.log("DOC:", documents[label]);
console.log("ALL DOCS:", documents);

              const url =
                typeof doc === "string"
                  ? doc
                  : doc?.url;

              const status =
                typeof doc === "object"
                  ? (
                      doc?.status ||
                      "Pending Review"
                    )
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
                  className="
                    border
                    rounded-xl
                    p-4
                  "
                >

                  {/* =====================================
                      TOP
                  ===================================== */}

                  <div className="flex justify-between items-start">

                    <div>

  <p className="font-medium text-sm">

    {url ? "✅" : "⬜"}{" "}
    {label}

  </p>

  {note && (

    <p className="text-xs text-gray-500 mt-1">
      {note}
    </p>

  )}

                      {url ? (

                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="
                            text-purple-600
                            text-sm
                            hover:underline
                          "
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
                      className={`
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-semibold
                        ${badgeColor(status)}
                      `}
                    >
                      {status}
                    </span>

                  </div>

                  {/* =====================================
                      URL
                  ===================================== */}

                  {url && (

                    <div className="mt-2 text-xs text-gray-500 break-all">

                      {url}

                    </div>

                  )}

                  {/* =====================================
                      FEEDBACK
                  ===================================== */}

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

                        onChange={(e) => {

                          const value =
                            e.target.value;

                          setFeedbacks(prev => ({
                            ...prev,
                            [label]: value,
                          }));
                        }}

                        className="
                          w-full
                          border
                          rounded-xl
                          p-3
                          text-sm
                        "
                      />

                      <div className="flex gap-3">

                        <button
                          onClick={() =>
                            updateDocument(
                              label,
                              "Approved"
                            )
                          }
                          className="
                            bg-green-600
                            hover:bg-green-700
                            text-white
                            px-4
                            py-2
                            rounded-xl
                            text-sm
                          "
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
                          className="
                            bg-red-600
                            hover:bg-red-700
                            text-white
                            px-4
                            py-2
                            rounded-xl
                            text-sm
                          "
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
