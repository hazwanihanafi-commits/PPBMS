import { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

export default function SupervisorRemark({
  studentMatric,
  studentEmail,
  assessmentType = "GENERAL",
  assessmentInstance = "",
  initialRemark = ""
}) {

  const [remark, setRemark] =
    useState(initialRemark);

  const [status, setStatus] =
    useState("Saved");

  /* =========================
     LOAD EXISTING REMARK
  ========================= */

  useEffect(() => {

    if (!studentEmail) return;

    loadRemark();

  }, [
    studentEmail,
    assessmentType,
    assessmentInstance
  ]);

  async function loadRemark() {

    try {

      const token =
        localStorage.getItem(
          "ppbms_token"
        );

      const res = await fetch(
        `${API_BASE}/api/supervisor/cqi/supervisor-remark/${encodeURIComponent(studentEmail)}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const data =
        await res.json();

      if (!res.ok) return;

      const remarks =
        data.remarks || [];

      const current =
        remarks.find(
          r =>

            r.assessmentType ===
              assessmentType &&

            (
              r.assessmentInstance ||
              ""
            ) ===
            (
              assessmentInstance ||
              ""
            )
        );

      setRemark(
        current?.remark || ""
      );

    } catch (e) {

      console.error(
        "Load remark error:",
        e
      );
    }
  }

  /* =========================
     AUTOSAVE
  ========================= */

  useEffect(() => {

    if (
      remark === undefined ||
      remark === null ||
      !studentEmail
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        saveRemark();
      }, 1000);

    return () =>
      clearTimeout(timer);

  }, [remark]);

  /* =========================
     SAVE
  ========================= */

  async function saveRemark() {

    try {

      setStatus("Saving...");

      const token =
        localStorage.getItem(
          "ppbms_token"
        );

      const res = await fetch(
        `${API_BASE}/api/supervisor/cqi/supervisor-remark`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({

            studentMatric,

            studentEmail,

            assessmentType,

            assessmentInstance,

            remark

          })
        }
      );

      const data =
        await res.json();

      if (!res.ok) {

        throw new Error(
          data.message ||
          data.error ||
          "Failed to save remark"
        );
      }

      setStatus("Saved");

    } catch (e) {

      console.error(
        "Remark save error:",
        e
      );

      setStatus(
        `Error: ${e.message}`
      );
    }
  }

  /* =========================
     UI
  ========================= */

  return (

    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">

      <h3 className="font-semibold mb-2 text-gray-800">
        🛠 Supervisor Intervention & Remarks
      </h3>

      <p className="text-xs text-gray-500 mb-1">
        Assessment Type:
        {" "}
        {assessmentType}
      </p>

      {assessmentInstance && (

        <p className="text-xs text-purple-600 mb-3">
          Instance:
          {" "}
          {assessmentInstance}
        </p>

      )}

      <textarea
        className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        rows={5}
        placeholder={`Supervisor intervention notes for ${assessmentType}...`}
        value={remark}
        onChange={(e) =>
          setRemark(
            e.target.value
          )
        }
      />

      <div className="mt-2 flex justify-between items-center">

        <p className="text-xs text-gray-500">
          Student:
          {" "}
          {studentEmail}
        </p>

        <p
          className={`text-xs font-medium ${
            status.includes("Error")
              ? "text-red-500"
              : status === "Saving..."
              ? "text-amber-500"
              : "text-green-600"
          }`}
        >
          {status}
        </p>

      </div>

    </div>
  );
}
