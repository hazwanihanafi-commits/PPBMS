import { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";

/* =========================================================
   MSc DOCUMENT CHECKLIST
========================================================= */

const MSC_CHECKLIST = [

  {
    name:
      "Development Plan & Learning Contract (DPLC)",

    role:
      "Student Upload"
  },

  {
    name:
      "Student Supervision Logbook",

    role:
      "Student Upload"
  },

  {
  name:
    "Annual Progress Review – Year 1 Submission Folder",

  role:
    "Student Upload",

  note:
    "Upload ONE folder containing Written Report and Presentation Slides"
},

  {
    name:
      "Ethics Approval",

    role:
      "Student Upload"
  },

  {
    name:
      "Conference Presentation",

    role:
      "Student Upload"
  },

  {
    name:
      "Final Notice of Thesis Submission Form",

    role:
      "Student Upload"
  },

  {
    name:
      "Correction Verification (Final Submission to IPS)",

    role:
      "Student Upload"
  },

  {
    name:
      "Final Thesis",

    role:
      "Student Upload"
  },



];

/* =========================================================
   PhD DOCUMENT CHECKLIST
========================================================= */

const PHD_CHECKLIST = [

  {
    name:
      "Development Plan & Learning Contract (DPLC)",

    role:
      "Student Upload"
  },

  {
    name:
      "Student Supervision Logbook",

    role:
      "Student Upload"
  },

  {
  name:
    "Annual Progress Review – Year 1 Submission Folder",

  role:
    "Student Upload",

  note:
    "Upload ONE folder containing Written Report and Presentation Slides"
},

  {
  name:
    "Annual Progress Review – Year 2 Submission Folder",

  role:
    "Student Upload",

  note:
    "Upload ONE folder containing Written Report and Presentation Slides"
},

  {
    name:
      "Ethics Approval",

    role:
      "Student Upload"
  },

  {
    name:
      "Publication Acceptance",

    role:
      "Student Upload"
  },

  {
    name:
      "Proof of Submission",

    role:
      "Student Upload"
  },

  {
    name:
      "Conference Presentation",

    role:
      "Student Upload"
  },

  {
    name:
      "Final Notice of Thesis Submission Form",

    role:
      "Student Upload"
  },

  {
    name:
      "Correction Verification (Final Submission to IPS)",

    role:
      "Student Upload"
  },

  {
    name:
      "Final Thesis",

    role:
      "Student Upload"
  },



];

export default function StudentChecklist({
  documents = {},
  programme = "",
  onSaved,
}) {

  const [links, setLinks] =
    useState({});

  /* =========================================================
     PROGRAMME DETECTION
  ========================================================= */

  const programmeText =
    String(programme || "")
      .toUpperCase();

  const isMsc =

    programmeText.includes("MASTER")

    ||

    programmeText.includes("MSC")

    ||

    programmeText.includes(
      "MASTER OF SCIENCE"
    );

  const checklistItems =
    isMsc
      ? MSC_CHECKLIST
      : PHD_CHECKLIST;

  /* =========================================================
     LOAD LINKS
  ========================================================= */

  useEffect(() => {

    const mapped = {};

    Object.entries(documents)
      .forEach(([key, value]) => {

        mapped[key] =
          typeof value === "string"
            ? value
            : value?.url || "";
      });

    setLinks(mapped);

  }, [documents]);

  /* =========================================================
     SAVE
  ========================================================= */

  async function saveDocument(name) {

    try {

      await authFetch(
        "/api/student/save-document",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            link: links[name] || "",
          }),
        }
      );

      alert("Document saved");

      if (onSaved) {
        onSaved();
      }

    } catch (err) {

      console.error(err);

      alert(
        "Failed to save document"
      );
    }
  }

  /* =========================================================
     BADGE COLOR
  ========================================================= */

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

  /* =========================================================
     UI
  ========================================================= */

  return (

    <div className="space-y-6">

      <h2 className="text-2xl font-bold">
        📁 Student Checklist
      </h2>

      {checklistItems.map((itemObj) => {

        const item =
          itemObj.name;

        const role =
          itemObj.role;

        const doc =
          documents[item] || {};

        const status =
          doc.status ||
          (
            links[item]
              ? "Pending Review"
              : "Not Submitted"
          );

        return (

          <div
            key={item}
            className="
              bg-white
              rounded-2xl
              p-5
              shadow
              border
            "
          >

            {/* HEADER */}

            <div className="flex justify-between items-start mb-4">

              <div>

                <h3 className="font-semibold text-lg">
                  {item}
                </h3>

                <p className="
                  text-xs
                  mt-1
                  inline-block
                  px-2
                  py-1
                  rounded-full
                  bg-indigo-100
                  text-indigo-700
                ">
                  {role}
                </p>

                {doc.reviewed_by && (

                  <p className="text-xs text-gray-400 mt-2">

                    Reviewed by:
                    {" "}
                    {doc.reviewed_by}

                  </p>

                )}

                {doc.reviewed_at && (

                  <p className="text-xs text-gray-400">

                    Reviewed at:
                    {" "}
                    {doc.reviewed_at}

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

            {/* INPUT */}

            {role === "Admin / IPS Upload" ? (

              <div className="
                bg-gray-100
                text-gray-500
                rounded-xl
                p-4
                text-sm
              ">

                This document will be uploaded
                by IPS / administrator.

              </div>

            ) : (

              <div className="flex gap-3">

                <input
                  type="text"
                  placeholder="Paste Google Drive / folder link here"
                  value={links[item] || ""}
                  onChange={(e) =>
                    setLinks({
                      ...links,
                      [item]:
                        e.target.value,
                    })
                  }
                  className="
                    flex-1
                    border
                    rounded-xl
                    px-4
                    py-3
                  "
                />

                <button
                  onClick={() =>
                    saveDocument(item)
                  }
                  className="
                    bg-purple-600
                    hover:bg-purple-700
                    text-white
                    px-5
                    py-3
                    rounded-xl
                    font-semibold
                  "
                >
                  Save
                </button>

              </div>

            )}

            {/* LINK */}

            {links[item] && (

              <a
                href={links[item]}
                target="_blank"
                rel="noreferrer"
                className="
                  text-sm
                  text-blue-600
                  underline
                  mt-3
                  inline-block
                "
              >
                View Submitted Document
              </a>

            )}

            {/* FEEDBACK */}

            {doc.feedback && (

              <div
                className="
                  mt-4
                  bg-gray-50
                  border
                  rounded-xl
                  p-4
                "
              >

                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Supervisor Feedback
                </p>

                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {doc.feedback}
                </p>

              </div>

            )}

          </div>

        );
      })}

    </div>
  );
}
