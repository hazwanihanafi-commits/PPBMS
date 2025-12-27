import { useEffect, useState } from "react";
import { apiGet } from "@/utils/api";

export default function AdminDashboard() {
  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");
  const [ploCQI, setPloCQI] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===============================
     AUTH GUARD
  =============================== */
  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");

    if (!token || role !== "admin") {
      window.location.href = "/login";
    }
  }, []);

  /* ===============================
     LOAD PROGRAMMES
  =============================== */
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/api/admin/programmes");
        setProgrammes(data.programmes || []);
      } catch (e) {
        console.error("Load programmes error:", e.message);
        setProgrammes([]);
      }
    })();
  }, []);

  /* ===============================
     LOAD PROGRAMME DATA
  =============================== */
  useEffect(() => {
    if (!programme) return;

    setLoading(true);

    (async () => {
      try {
        const ploRes = await apiGet(
          `/api/admin/programme-plo?programme=${encodeURIComponent(programme)}`
        );

        const studentRes = await apiGet(
          `/api/admin/programme-students?programme=${encodeURIComponent(programme)}`
        );

        setPloCQI(ploRes.plo || null);
        setStudents(studentRes.students || []);
      } catch (e) {
        console.error("Admin dashboard load error:", e.message);
        setPloCQI(null);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [programme]);

  /* ===============================
     PROGRESS BADGE
  =============================== */
  function progressBadge(s) {
    if (s.status === "Graduated") {
      return (
        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
          Completed
        </span>
      );
    }

    return (
      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
        On Track
      </span>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-purple-700">
        Admin Dashboard
      </h1>

      {/* PROGRAMME SELECT */}
      <select
        className="w-full p-3 border rounded"
        value={programme}
        onChange={e => setProgramme(e.target.value)}
      >
        <option value="">Select Programme</option>
        {programmes.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* PROGRAMME CQI */}
      {ploCQI && (
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-1">
            Programme CQI (Graduated Students)
          </h2>

          <p className="text-xs text-gray-500 mb-3">
            Benchmark: ≥ 70% attainment
          </p>

          {Object.entries(ploCQI).map(([k, v]) => (
            <div key={k} className="mb-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{k}</span>
                <span>
                  {v.percent !== null ? `${v.percent}%` : "-%"} (
                  {v.achieved}/{v.total})
                </span>
              </div>

              <div className="text-xs text-gray-600">
                Status: <strong>{v.status}</strong>
              </div>

              <div className="w-full h-2 bg-gray-200 rounded mt-1">
                <div
                  className={`h-2 rounded ${
                    v.status === "Achieved"
                      ? "bg-green-500"
                      : v.status === "Borderline"
                      ? "bg-yellow-500"
                      : v.status === "Not Assessed"
                      ? "bg-gray-400"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${v.percent || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STUDENTS TABLE */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-3">
          Students ({students.length})
        </h2>

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Matric</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Progress</th>
            </tr>
          </thead>

          <tbody>
            {students.map((s, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 text-purple-700 font-medium">
                  <a
                    href={`/admin/student/${encodeURIComponent(s.email)}`}
                    className="hover:underline"
                  >
                    {s.email}
                  </a>
                </td>

                <td className="p-2">{s.matric}</td>

                <td className="p-2">
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                    {s.status}
                  </span>
                </td>

                <td className="p-2">
                  {progressBadge(s)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="text-center text-gray-500">
          Loading…
        </div>
      )}
    </div>
  );
}
