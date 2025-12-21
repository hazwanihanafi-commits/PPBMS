import { useEffect, useState } from "react";
import { API_BASE } from "../../utils/api";
import { useRouter } from "next/router";

export default function AdminDashboard() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/all-students`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
        },
      });

      const json = await res.json();

      /* ✅ Calculate progress + risk */
      const enriched = (json.students || []).map((st) => {
        const timeline = st.timeline || [];

        const progressPercent = timeline.length
          ? Math.round(
              (timeline.filter(t => t.status === "Completed").length /
                timeline.length) * 100
            )
          : 0;

        let risk = "On Track";
        if (progressPercent < 50) risk = "At Risk";
        else if (progressPercent < 80) risk = "Slightly Late";

        return {
          ...st,
          progressPercent,
          risk,
        };
      });

      setStudents(enriched);
    } catch (e) {
      console.error("Admin load error:", e);
    } finally {
      setLoading(false);
    }
  }

  function riskBadge(risk) {
    if (risk === "At Risk")
      return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">At Risk</span>;
    if (risk === "Slightly Late")
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Slightly Late</span>;
    return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">On Track</span>;
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <h1 className="text-3xl font-extrabold text-purple-900 mb-6">
        Admin Dashboard – All Students
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {students.map((st) => (
          <div
            key={st.email}
            className="bg-white p-6 rounded-2xl shadow border border-gray-100"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold uppercase">
                {st.name}
              </h2>
              {riskBadge(st.risk)}
            </div>

            <p className="text-sm"><strong>Email:</strong> {st.email}</p>
            <p className="text-sm"><strong>Programme:</strong> {st.programme}</p>

            {/* PROGRESS */}
            <div className="mt-3">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <strong>{st.progressPercent}%</strong>
              </div>

              <div className="bg-gray-200 h-2 rounded-full mt-1">
                <div
                  className={`h-2 rounded-full ${
                    st.risk === "At Risk"
                      ? "bg-red-500"
                      : st.risk === "Slightly Late"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${st.progressPercent}%` }}
                />
              </div>
            </div>

            {/* 🔗 IMPORTANT: LINK TO SUPERVISOR STUDENT PAGE */}
            <button
              onClick={() =>
                router.push(`/supervisor/${encodeURIComponent(st.email)}`)
              }
              className="mt-4 text-purple-700 font-medium hover:underline"
            >
              View Full Student Record →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
