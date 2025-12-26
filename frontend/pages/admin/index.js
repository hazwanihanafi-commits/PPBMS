import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function AdminDashboard() {
  const router = useRouter();

  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");
  const [plo, setPlo] = useState(null);
  const [students, setStudents] = useState([]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("ppbms_token")
      : null;

  /* ================= LOAD PROGRAMMES ================= */
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/admin/programmes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setProgrammes(data.programmes || []);
        if (data.programmes?.length) {
          setProgramme(data.programmes[0]);
        }
      })
      .catch(console.error);
  }, [token]);

  /* ================= LOAD CQI ================= */
  useEffect(() => {
    if (!programme || !token) return;

    fetch(
      `${API_BASE}/api/admin/programme-plo?programme=${encodeURIComponent(
        programme
      )}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then(res => res.json())
      .then(data => setPlo(data.plo || null))
      .catch(console.error);
  }, [programme, token]);

  /* ================= LOAD STUDENTS ================= */
  useEffect(() => {
    if (!programme || !token) return;

    fetch(
      `${API_BASE}/api/admin/programme-students?programme=${encodeURIComponent(
        programme
      )}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then(res => res.json())
      .then(data => setStudents(data.students || []))
      .catch(console.error);
  }, [programme, token]);

  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">
      <h1 className="text-3xl font-extrabold text-purple-900">
        Admin Dashboard
      </h1>

      {/* Programme selector */}
      <div className="bg-white p-4 rounded-xl shadow">
        <label className="font-semibold text-sm">Select Programme</label>
        <select
          value={programme}
          onChange={e => setProgramme(e.target.value)}
          className="w-full mt-2 border rounded px-3 py-2"
        >
          {programmes.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* CQI */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">
          Programme CQI (Graduated Students)
        </h2>

        {!plo && <p className="text-sm text-gray-500">No CQI data</p>}

        {plo &&
          Object.entries(plo).map(([key, d]) => (
            <div key={key} className="mb-4">
              <div className="flex justify-between text-sm font-semibold">
                <span>{key}</span>
                <span>
                  {d.percent ?? "-"}% ({d.achieved}/{d.assessed})
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded mt-1">
                <div
                  className={`h-2 rounded ${
                    d.status === "Achieved"
                      ? "bg-green-500"
                      : d.status === "Borderline"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${d.percent || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Status: <strong>{d.status}</strong>
              </p>
            </div>
          ))}
      </div>

      {/* Students */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">
          Students ({students.length})
        </h2>

        {students.length === 0 && (
          <p className="text-sm text-gray-500">No students found</p>
        )}

        {students.length > 0 && (
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Matric</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.id}</td>
                  <td className="p-2">{s.email}</td>
                  <td className="p-2 font-semibold">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
