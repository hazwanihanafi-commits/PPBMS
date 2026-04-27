import { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

export default function SupervisorRemark({
  studentMatric,
  studentEmail,
  assessmentType = "GENERAL",
  initialRemark = ""
}) {
  const [remark, setRemark] = useState(initialRemark);
  const [status, setStatus] = useState("Saved");

  /* ================= LOAD INITIAL REMARK ================= */
  useEffect(() => {
    setRemark(initialRemark || "");
  }, [initialRemark]);

  /* ================= AUTOSAVE ================= */
  useEffect(() => {
    // prevent autosave on first render before values ready
    if (
      remark === undefined ||
      remark === null ||
      !studentEmail
    ) {
      return;
    }

    const timer = setTimeout(() => {
      saveRemark();
    }, 1000);

    return () => clearTimeout(timer);
  }, [remark]);

  /* ================= SAVE FUNCTION ================= */
  async function saveRemark() {
    try {
      setStatus("Saving...");

      const token = localStorage.getItem("ppbms_token");

      console.log("SAVING REMARK:", {
        studentMatric,
        studentEmail,
        assessmentType,
        remark
      });

      const res = await fetch(
        `${API_BASE}/api/supervisor/remark`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            studentMatric,
            studentEmail,
            assessmentType,
            remark
          })
        }
      );

      const data = await res.json();

      console.log("REMARK RESPONSE:", data);

      if (!res.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Failed to save remark"
        );
      }

      setStatus("Saved");
    } catch (e) {
      console.error("Remark save error:", e);
      setStatus(`Error: ${e.message}`);
    }
  }

  /* ================= UI ================= */
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">

      <h3 className="font-semibold mb-2 text-gray-800">
        🛠 Supervisor Intervention & Remarks
      </h3>

      <p className="text-xs text-gray-500 mb-3">
        Assessment Type: {assessmentType}
      </p>

      <textarea
        className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        rows={5}
        placeholder={`Supervisor intervention notes for ${assessmentType}...`}
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
      />

      <div className="mt-2 flex justify-between items-center">

        <p className="text-xs text-gray-500">
          Student: {studentEmail}
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
