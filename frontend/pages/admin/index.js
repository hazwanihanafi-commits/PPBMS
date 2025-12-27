import { useEffect, useState } from "react";
import { apiGet } from "@/utils/api";

/* ======================================================
   ADMIN DASHBOARD
====================================================== */
export default function AdminDashboard() {
  /* ================= STATE ================= */
  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");
  const [activeTab, setActiveTab] = useState("cqi"); // cqi | tracking

  // Tab 1: CQI (Graduated)
  const [ploCQI, setPloCQI] = useState(null);
  const [graduatesCount, setGraduatesCount] = useState(0);
  const [graduatedStudents, setGraduatedStudents] = useState([]);

  // Tab 2: Tracking (Active)
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);

  /* ================= AUTH GUARD ================= */
  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");
    if (!token || role !== "admin") {
      window.location.href = "/login";
    }
  }, []);

  /* ================= LOAD PROGRAMMES ================= */
  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/api/admin/programmes");
        setProgrammes(res.programmes || []);
      } catch {
        setProgrammes([]);
      }
    })();
  }, []);

  /* ================= TAB 1: PROGRAMME CQI ================= */
  useEffect(() => {
    if (!programme || activeTab !== "cqi") return;

    (async () => {
      setLoading(true);
      try {
        const res = await apiGet(
          `/api/admin/programme-plo?programme=${encodeURIComponent(programme)}`
        );

        setPloCQI(res.plo || null);
        setGraduatesCount(res.graduates || 0);
        setGraduatedStudents(res.students || []);
      } catch {
        setPloCQI(null);
        setGraduatesCount(0);
        setGraduatedStudents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [programme, activeTab]);

  /* ================= TAB 2: STUDENT TRACKING ================= */
  useEffect(() => {
    if (!programme || activeTab !== "tracking") return;

    (async () => {
      setLoading(true);
      try {
        const res = await apiGet(
          `/api/admin/programme-students?programme=${encodeURIComponent(programme)}`
        );
        setStudents(res.students || []);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [programme, activeTab]);

  /* ================= HELPERS ================= */
  function trackingStatus(s) {
    if (!s.expected_end) return "On Track";
    const now = new Date();
    const expected = new Date(s.expected_end);
    return expected < now ? "Late" : "On Track";
  }

  function statusBadge(status) {
    return status === "Late" ? (
      <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
        Late
      </span>
    ) : (
      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
        On Track
      </span>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-purple-700">
        Admin Dashboard
      </h1>

      {/* PROGRAMME SELECTOR */}
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
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab("cqi")}
          className={`px-4 py-2 rounded-xl font-semibold ${
            activeTab === "cqi"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Programme CQI
        </button>

        <button
          onClick={() => setActiveTab("tracking")}
          className={`px-4 py-2 rounded-xl font-semibold ${
            activeTab === "tracking"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Student Tracking
        </button>
      </div>

      {/* =====================================================
          TAB 1 — PROGRAMME CQI (GRADUATED)
      ====================================================== */}
      {activeTab === "cqi" && ploCQI && (
        <div className="bg-white rounded shadow p-4 space-y-6">

          <div>
            <h2 className="font-semibold mb-1">
              Programme CQI (Graduated Students)
            </h2>
            <p className="text-xs text-gray-600">
              Graduated cohort size: <strong>{graduatesCount}</strong><br />
              Benchmark: ≥ 70% attainment
            </p>
          </div>

          {/* PLO BARS */}
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
                      : "bg-red-500"
                  }`}
                  style={{ width: `${v.percent || 0}%` }}
                />
              </div>
            </div>
          ))}

          {/* GRADUATED STUDENTS LIST */}
          <div>
            <h3 className="font-semibold mb-2">
              Graduated Students ({graduatedStudents.length})
            </h3>

            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Matric</th>
                  <th className="p-2 text-left">Profile</th>
                </tr>
              </thead>
              <tbody>
                {graduatedStudents.map((s, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{s.name || "-"}</td>
                    <td className="p-2">{s.matric}</td>
                    <td className="p-2">
                      {s.email ? (
                        <a
                          href={`/admin/student/${encodeURIComponent(s.email)}`}
                          className="text-purple-700 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================
          TAB 2 — STUDENT TRACKING (ACTIVE)
      ====================================================== */}
      {activeTab === "tracking" && (
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-3">
            Active Student Tracking ({students.length})
          </h2>

          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Matric</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Profile</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{s.email}</td>
                  <td className="p-2">{s.matric}</td>
                  <td className="p-2">
                    {statusBadge(trackingStatus(s))}
                  </td>
                  <td className="p-2">
                    {s.email ? (
                      <a
                        href={`/admin/student/${encodeURIComponent(s.email)}`}
                        className="text-purple-700 hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
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
