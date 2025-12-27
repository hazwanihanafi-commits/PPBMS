import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/utils/api";

/* ======================
   TABS
====================== */
function Tabs({ active, setActive }) {
  const Tab = ({ id, label }) => (
    <button
      onClick={() => setActive(id)}
      className={`px-4 py-2 rounded-xl font-semibold ${
        active === id
          ? "bg-purple-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-3 mb-6">
      <Tab id="graduates" label="Programme CQI (Graduated)" />
      <Tab id="tracking" label="Student Tracking (Active)" />
    </div>
  );
}

/* ======================
   STATUS HELPERS
====================== */
function deriveStatus(expected, actual) {
  if (actual) return "Completed";
  if (!expected) return "On Track";
  return new Date(expected) < new Date() ? "Late" : "On Track";
}

function statusBadge(status) {
  if (status === "Completed") {
    return (
      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
        Completed
      </span>
    );
  }

  if (status === "Late") {
    return (
      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
        Late
      </span>
    );
  }

  return (
    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
      On Track
    </span>
  );
}

/* ======================
   PAGE
====================== */
export default function AdminDashboard() {
  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");
  const [activeTab, setActiveTab] = useState("graduates");

  const [cqi, setCQI] = useState(null);
  const [graduates, setGraduates] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ======================
     AUTH GUARD
  ====================== */
  useEffect(() => {
    const role = localStorage.getItem("ppbms_role");
    if (role !== "admin") {
      window.location.href = "/login";
    }
  }, []);

  /* ======================
     LOAD PROGRAMMES
  ====================== */
  useEffect(() => {
    apiGet("/api/admin/programmes")
      .then(d => setProgrammes(d.programmes || []))
      .catch(() => setProgrammes([]));
  }, []);

  /* ======================
     LOAD PROGRAMME DATA
  ====================== */
  useEffect(() => {
    if (!programme) return;
    setLoading(true);

    Promise.all([
      apiGet(`/api/admin/programme-plo?programme=${programme}`),
      apiGet(`/api/admin/programme-graduates?programme=${programme}`),
      apiGet(`/api/admin/programme-active-students?programme=${programme}`)
    ])
      .then(([plo, grad, active]) => {
        setCQI(plo.plo || null);
        setGraduates(grad.students || []);
        setActiveStudents(active.students || []);
      })
      .finally(() => setLoading(false));
  }, [programme]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
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
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <Tabs active={activeTab} setActive={setActiveTab} />

      {loading && <div className="text-gray-500">Loading…</div>}

      {/* =====================================================
         TAB 1 — GRADUATED + CQI
      ===================================================== */}
      {activeTab === "graduates" && (
        <>
          {/* COUNT */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold">
              Graduated Students: {graduates.length}
            </h2>
          </div>

          {/* CQI */}
          {cqi && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-semibold mb-4">
                Programme CQI (Benchmark ≥ 70%)
              </h3>

              {Object.entries(cqi).map(([plo, v]) => (
                <div key={plo} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{plo}</span>
                    <span>{v.percent ?? "-"}%</span>
                  </div>

                  <div className="w-full h-2 bg-gray-200 rounded">
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
            </div>
          )}

          {/* GRADUATED TABLE */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-3">Graduated Students</h3>

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
                      <Link
                        href={`/admin/student/${encodeURIComponent(s.email)}`}
                        className="text-purple-600 underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* =====================================================
         TAB 2 — ACTIVE TRACKING
      ===================================================== */}
      {activeTab === "tracking" && (
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-3">Active Student Tracking</h3>

          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2">Matric</th>
                <th className="p-2">Profile</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeStudents.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.matric}</td>
                  <td className="p-2">
                    <Link
                      href={`/admin/student/${encodeURIComponent(s.email)}`}
                      className="text-purple-600 underline"
                    >
                      View
                    </Link>
                  </td>
                  <td className="p-2">{statusBadge(s.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
