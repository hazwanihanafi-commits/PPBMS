import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiGet } from "@/utils/api";

/* ================= STATUS BADGE ================= */
function StatusBadge({ status }) {
  const map = {
    COMPLETED: "bg-green-100 text-green-700",
    LATE: "bg-red-100 text-red-700",
    ON_TRACK: "bg-blue-100 text-blue-700"
  };

  return (
    <span className={`px-2 py-1 rounded text-xs ${map[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

/* ================= PAGE ================= */
export default function AdminDashboard() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [programme, setProgramme] = useState("");
  const [programmes, setProgrammes] = useState([]);

  const [graduates, setGraduates] = useState([]);
  const [active, setActive] = useState([]);

  /* ================= AUTH ================= */
  useEffect(() => {
    const role = localStorage.getItem("ppbms_role");
    if (role !== "admin") {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, []);

  /* ================= LOAD PROGRAMMES ================= */
  useEffect(() => {
    if (!checked) return;
    apiGet("/api/admin/programmes").then(r => setProgrammes(r.programmes || []));
  }, [checked]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!programme) return;

    Promise.all([
      apiGet(`/api/admin/programme-graduates?programme=${programme}`),
      apiGet(`/api/admin/programme-active-students?programme=${programme}`)
    ]).then(([g, a]) => {
      setGraduates(g.students || []);
      setActive(a.students || []);
    });
  }, [programme]);

  if (!checked) return <div className="p-6">Checking access…</div>;

  /* ================= SUMMARY ================= */
  const late = active.filter(s => s.status === "LATE").length;
  const onTrack = active.filter(s => s.status === "ON_TRACK").length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-bold text-purple-700">
        Admin Dashboard
      </h1>

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

      {/* ================= SUMMARY CARDS ================= */}
      {programme && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard label="Late" value={late} color="red" />
          <SummaryCard label="On Track" value={onTrack} color="blue" />
          <SummaryCard label="Graduated" value={graduates.length} color="green" />
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
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {active.map((s, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.matric}</td>
                <td className="p-2">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

/* ================= SUMMARY CARD ================= */
function SummaryCard({ label, value, color }) {
  const colors = {
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700"
  };

  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
