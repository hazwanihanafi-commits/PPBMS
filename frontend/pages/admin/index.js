import { useEffect, useState } from "react";
import { apiGet } from "@/utils/api";

export default function AdminDashboard() {
  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");
  const [activeTab, setActiveTab] = useState("cqi");

  const [ploCQI, setPloCQI] = useState(null);
  const [graduates, setGraduates] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);

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
      const res = await apiGet("/api/admin/programmes");
      setProgrammes(res.programmes || []);
    })();
  }, []);

  /* ===============================
     LOAD DATA PER PROGRAMME
  =============================== */
  useEffect(() => {
    if (!programme) return;

    setLoading(true);
    (async () => {
      try {
        const [cqiRes, gradRes, activeRes] = await Promise.all([
          apiGet(`/api/admin/programme-plo?programme=${encodeURIComponent(programme)}`),
          apiGet(`/api/admin/programme-graduates?programme=${encodeURIComponent(programme)}`),
          apiGet(`/api/admin/programme-active-students?programme=${encodeURIComponent(programme)}`)
        ]);

        setPloCQI(cqiRes.plo || null);
        setGraduates(gradRes.students || []);
        setActiveStudents(activeRes.students || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [programme]);

  /* ===============================
     LATE / ON TRACK LOGIC
     (Expected vs Today)
  =============================== */
  function trackStatus(s) {
    if (!s.expected_end) return "On Track";
    const today = new Date();
    const expected = new Date(s.expected_end);
    return expected < today ? "Late" : "On Track";
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

      {/* TABS */}
      {programme && (
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("cqi")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              activeTab === "cqi"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Programme CQI
          </button>

          <button
            onClick={() => setActiveTab("tracking")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              activeTab === "tracking"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Student Tracking
          </button>
        </div>
      )}

      {/* ===============================
          TAB 1 — PROGRAMME CQI
      =============================== */}
      {activeTab === "cqi" && ploCQI && (
        <div className="bg-white rounded shadow p-4 space-y-4">
          <h2 className="font-semibold">
            Programme CQI (Graduated Students)
          </h2>

          <p className="text-xs text-gray-500">
            Graduated cohort size: {graduates.length} <br />
            Benchmark: ≥ 70% attainment
          </p>

          {Object.entries(ploCQI).map(([plo, v]) => (
            <div key={plo}>
              <div className="flex justify-between text-sm">
                <span>{plo}</span>
                <span>{v.percent ?? "-"}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded">
                <div
                  className={`h-2 rounded ${
                    v.status === "Achieved"
                      ? "bg-green-500"
                      : v.status === "Borderline"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${v.percent || 0}%` }}
                />
              </div>
            </div>
          ))}

          {/* GRADUATED LIST */}
          <div className="pt-4">
            <h3 className="font-semibold mb-2">
              Graduated Students ({graduates.length})
            </h3>

            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2">Matric</th>
                  <th className="p-2">Profile</th>
                </tr>
              </thead>
              <tbody>
                {graduates.map((s, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.matric}</td>
                    <td className="p-2">
                      <a
                        href={`/admin/student/${encodeURIComponent(s.email)}`}
                        className="text-purple-600 underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===============================
          TAB 2 — STUDENT TRACKING
      =============================== */}
      {activeTab === "tracking" && (
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-3">
            Active Student Tracking ({activeStudents.length})
          </h2>

          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Email</th>
                <th className="p-2">Matric</th>
                <th className="p-2">Status</th>
                <th className="p-2">Profile</th>
              </tr>
            </thead>
            <tbody>
              {activeStudents.map((s, i) => {
                const status = trackStatus(s);
                return (
                  <tr key={i} className="border-t">
                    <td className="p-2">{s.email}</td>
                    <td className="p-2">{s.matric}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          status === "Late"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-2">
                      <a
                        href={`/admin/student/${encodeURIComponent(s.email)}`}
                        className="text-purple-600 underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <div className="text-center text-gray-500">
          Loading…
        </div>
      )}
    </div>
  );
}
