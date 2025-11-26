import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

/* STATUS COLORS */
const STATUS_COLORS = {
  Ahead: "bg-green-100 text-green-700",
  "On Track": "bg-blue-100 text-blue-700",
  "At Risk": "bg-yellow-100 text-yellow-700",
  Behind: "bg-red-100 text-red-700",
};

export default function SupervisorDashboard() {
  const [token, setToken] = useState(null);
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [programme, setProgramme] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  /* Load token */
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) window.location.href = "/login";
    setToken(t);
  }, []);

  /* Fetch supervisor data */
  useEffect(() => {
    if (!token) return;

    (async () => {
      const r = await fetch(`${API}/api/admin/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await r.json();
      setRows(data.rows || []);
      setFiltered(data.rows || []);
    })();
  }, [token]);

  /* Apply filters */
  useEffect(() => {
    let list = [...rows];

    if (programme) list = list.filter((x) => x.programme === programme);
    if (status) list = list.filter((x) => x.status === status);
    if (search)
      list = list.filter((x) =>
        x.student_name.toLowerCase().includes(search.toLowerCase())
      );

    setFiltered(list);
  }, [programme, status, search, rows]);

  /* Count summary */
  const count = (s) => rows.filter((r) => r.status === s).length;
  const pct = (n) => (rows.length ? Math.round((n / rows.length) * 100) : 0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-purple-700">Supervisor Dashboard</h1>
        <p className="text-gray-600 mt-2 text-lg">
          Overview of all student progress and performance.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm max-w-6xl mx-auto mb-8 flex flex-wrap gap-4 items-center border">
        
        <select
          className="border rounded-lg px-3 py-2"
          value={programme}
          onChange={(e) => setProgramme(e.target.value)}
        >
          <option value="">All Programmes</option>
          <option>Doctor of Philosophy</option>
          <option>Master of Science</option>
        </select>

        <select
          className="border rounded-lg px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option>Ahead</option>
          <option>On Track</option>
          <option>At Risk</option>
          <option>Behind</option>
        </select>

        <input
          type="text"
          className="border rounded-lg px-3 py-2 flex-1"
          placeholder="Search student…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => {
            setProgramme("");
            setStatus("");
            setSearch("");
          }}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Clear
        </button>
      </div>

      {/* SUMMARY BOXES */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        {["Ahead", "On Track", "At Risk", "Behind"].map((s) => (
          <div
            key={s}
            className="bg-white rounded-xl shadow-sm p-6 border text-center"
          >
            <h3 className="text-lg font-medium">{s}</h3>
            <p className="text-3xl font-bold mt-2">{count(s)}</p>
            <p className="text-sm text-gray-500">{pct(count(s))}%</p>
          </div>
        ))}

      </div>

      {/* TABLE */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm p-6 border">

        <h2 className="text-2xl font-semibold mb-4">Student List</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-600">
              <th className="py-2">Student</th>
              <th>Programme</th>
              <th>Supervisor</th>
              <th>Progress</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => {
              const completed = ["P1 Submitted", "P3 Submitted", "P4 Submitted", "P5 Submitted"]
                .filter((m) => r.raw[m])
                .length;

              const percentage = Math.round((completed / 4) * 100);

              return (
                <tr key={r.student_id} className="border-b">
                  <td className="py-3 font-medium">{r.student_name}</td>
                  <td>{r.programme}</td>
                  <td>{r.main_supervisor}</td>

                  <td>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div
                        className="h-2 rounded-full bg-purple-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {r.status || "—"}
                    </span>
                  </td>

                  <td>
                    <a
                      href={`/student/me?id=${r.student_id}`}
                      className="text-purple-600 hover:underline"
                    >
                      View →
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

      </div>
    </div>
  );
}
