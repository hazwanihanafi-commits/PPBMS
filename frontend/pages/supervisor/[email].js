import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function SupervisorStudentDetails() {
  const router = useRouter();
  const { email } = router.query;

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [cqi, setCqi] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  async function loadStudent() {
    const token = localStorage.getItem("ppbms_token");
    const res = await fetch(
      `${API_BASE}/api/supervisor/student/${email}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const json = await res.json();
    setStudent(json.row);
    setTimeline(Array.isArray(json.row.timeline) ? json.row.timeline : []);
    setCqi(json.row.cqiByAssessment || {}); // ✅ FIXED
  }

  if (loading && !student) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 bg-purple-50 min-h-screen">
      <h2 className="text-xl font-bold mb-4">{student.student_name}</h2>

      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold mb-2">🎯 CQI by Assessment (TRX500)</h3>

        {Object.keys(cqi).length === 0 ? (
          <p className="text-sm text-gray-500">No CQI data</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(cqi).map(([plo, status]) => (
              <span
                key={plo}
                className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${status === "GREEN" ? "bg-green-100 text-green-700" :
                    status === "AMBER" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"}`}
              >
                {plo}: {status}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          GREEN ≥ 70% | AMBER 46–69% | RED &lt; 46%
        </p>
      </div>
    </div>
  );
}
