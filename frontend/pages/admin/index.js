import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { apiGet } from "@/utils/api";

/* ======================
   STATUS BADGE
====================== */
function StatusBadge({ status }) {
  const map = {
    Late: "bg-red-100 text-red-700",
    "On Track": "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700",
    Graduated: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-semibold ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

/* ======================
   PAGE
====================== */
export default function AdminDashboard() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");

  const [cqi, setCQI] = useState(null);
  const [graduates, setGraduates] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);

  const [summary, setSummary] = useState({
    late: 0,
    onTrack: 0,
    graduated: 0,
  });

  const [loading, setLoading] = useState(false);

  /* ======================
     AUTH GUARD
  ====================== */
  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");

    if (!token || role !== "admin") {
      router.replace("/login");
      return;
    }

    setChecked(true);
  }, [router.isReady]);

  /* ======================
     LOAD PROGRAMMES
  ====================== */
  useEffect(() => {
    if (!checked) return;

    apiGet("/api/admin/programmes")
      .then(d => setProgrammes(d.programmes || []))
      .catch(() => setProgrammes([]));
  }, [checked]);

  /* ======================
     LOAD PROGRAMME DATA
  ====================== */
  useEffect(() => {
    if (!programme) return;

    setLoading(true);

    Promise.all([
      apiGet(`/api/admin/programme-plo?programme=${programme}`),
      apiGet(`/api/admin/programme-graduates?programme=${programme}`),
      apiGet(`/api/admin/programme-active-students?programme=${programme}`),
      apiGet(`/api/admin/programme-summary?programme=${programme}`),
    ])
      .then(([plo, grad, active, sum]) => {
        setCQI(plo.plo || null);
        setGraduates(grad.students || []);
        setActiveStudents(active.students || []);
        setSummary(sum || { late: 0, onTrack: 0, graduated: 0 });
      })
      .finally(() => setLoading(false));
  }, [programme]);

  if (!checked) return <div className="p-6">Checking access…</div>;

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
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {loading && <div className="text-gray-500">Loading…</div>}

      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-100 p-4 rounded-xl">
          <div className="text-sm font-semibold">Late</div>
          <div className="text-2xl font-bold">{summary.late}</div>
        </div>

        <div className="bg-blue-100 p-4 rounded-xl">
          <div className="text-sm font-semibold">On Track</div>
          <div className="text-2xl font-bold">{summary.onTrack}</div>
        </div>

        <div className="bg-green-100 p-4 rounded-xl">
          <div className="text-sm font-semibold">Graduated</div>
          <div className="text-2xl font-bold">{summary.graduated}</div>
        </div>
      </div>

      {/* ================= FINAL PROGRAMME PLO (KEEP) ================= */}
      {cqi && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold mb-4">
            Final Programme PLO Achievement
          </h3>

          {Object.entries(cqi).map(([plo, v]) => (
            <div key={plo} className="mb-3">
              <div className="flex justify-between text-sm">
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

      {/* ================= ACTIVE STUDENTS ================= */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-3">Active Students</h3>

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
                    href={`/admin/student/${encodeURIComponent(s.email.trim().toLowerCase())}`}
                    className="text-purple-600 underline"
                  >
                    View
                  </Link>
                </td>
                <td className="p-2">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= GRADUATED STUDENTS ================= */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-3">Graduated Students</h3>

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Matric</th>
              <th className="p-2">Profile</th>
            </tr>
          </thead>
          <tbody>
            {graduates.map((g, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{g.name}</td>
                <td className="p-2">{g.matric}</td>
                <td className="p-2">
                  <Link
                    href={`/admin/student/${encodeURIComponent(g.email.trim().toLowerCase())}`}
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
    </div>
  );
}
