import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

const safe = (v) =>
  typeof v === "string" || typeof v === "number" ? v : "-";

export default function SupervisorStudentDetails() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqi, setCqi] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    try {
      setLoading(true);
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");

      setStudent(json.row || {});
      setTimeline(Array.isArray(json.row?.timeline) ? json.row.timeline : []);

      // 🔥 FORCE NEW OBJECT (THIS FIXES IT)
      const rawCQI = json.row?.cqiByAssessment;
      const safeCQI =
        rawCQI && typeof rawCQI === "object" && !Array.isArray(rawCQI)
          ? { ...rawCQI }
          : {};

      console.log("CQI RECEIVED:", safeCQI);
      setCqi(safeCQI);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!student) return <div className="p-6">No student data</div>;

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <button
        className="text-purple-700 underline mb-4"
        onClick={() => router.push("/supervisor")}
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">
        {safe(student.student_name)}
      </h1>

      <div className="bg-white rounded-xl p-4 mb-6 text-sm">
        <p><strong>Email:</strong> {safe(student.email)}</p>
        <p><strong>Matric:</strong> {safe(student.student_id)}</p>
        <p><strong>Programme:</strong> {safe(student.programme)}</p>
      </div>

      <div className="bg-white rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-2">Timeline</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-500">No timeline data</p>
        ) : (
          <ul className="list-disc ml-5 text-sm">
            {timeline.map((t, i) => (
              <li key={i}>{safe(t.activity)}</li>
            ))}
          </ul>
        )}
      </div>

      {/* ✅ CQI FINALLY RENDERS */}
      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold mb-3">
          🎯 CQI by Assessment (TRX500)
        </h3>

        {Object.keys(cqi).length === 0 ? (
          <p className="text-sm text-gray-500">No CQI data</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(cqi).map(([plo, status]) => {
              let color = "bg-gray-200 text-gray-700";
              if (status === "GREEN") color = "bg-green-100 text-green-700";
              if (status === "AMBER") color = "bg-yellow-100 text-yellow-700";
              if (status === "RED") color = "bg-red-100 text-red-700";

              return (
                <span
                  key={plo}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}
                >
                  {plo}: {status}
                </span>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          <strong>Legend:</strong> GREEN ≥ 70% | AMBER 46–69% | RED &lt; 46%
        </p>
      </div>
    </div>
  );
}
