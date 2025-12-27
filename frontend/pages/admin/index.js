import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

export default function AdminDashboard() {
  const router = useRouter();

  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");
  const [plo, setPlo] = useState(null);
  const [students, setStudents] = useState([]);

  /* ================= LOAD PROGRAMMES ================= */
  useEffect(() => {
    fetch(`${API_BASE}/api/admin/programmes`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`
      }
    })
      .then(r => r.json())
      .then(d => {
        setProgrammes(d.programmes || []);
        setProgramme(d.programmes?.[0] || "");
      });
  }, []);

  /* ================= LOAD CQI ================= */
  useEffect(() => {
    if (!programme) return;

    fetch(
      `${API_BASE}/api/admin/programme-plo?programme=${encodeURIComponent(
        programme
      )}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`
        }
      }
    )
      .then(r => r.json())
      .then(d => setPlo(d.plo || null));
  }, [programme]);

  /* ================= LOAD STUDENTS ================= */
  useEffect(() => {
    if (!programme) return;

    fetch(
      `${API_BASE}/api/admin/programme-students?programme=${encodeURIComponent(
        programme
      )}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`
        }
      }
    )
      .then(r => r.json())
      .then(d => setStudents(d.students || []));
  }, [programme]);

  return (
    <div className="p-6 space-y-6">

      <select
        value={programme}
        onChange={e => setProgramme(e.target.value)}
        className="border p-2 rounded"
      >
        {programmes.map(p => (
          <option key={p}>{p}</option>
        ))}
      </select>

      {/* ================= CQI ================= */}
      {plo &&
        Object.entries(plo).map(([k, d]) => (
          <div key={k}>
            <strong>{k}</strong> — {d.percent}% ({d.achieved}/{d.assessed}) —{" "}
            <b>{d.status}</b>
          </div>
        ))}

      {/* ================= STUDENTS ================= */}
      <table className="border w-full mt-6">
        <thead>
          <tr>
            <th>Email</th>
            <th>Matric</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => (
            <tr key={i}>
              <td>
                <a
                  href={`/supervisor/${encodeURIComponent(s.email)}`}
                  className="text-purple-700 underline"
                >
                  {s.email}
                </a>
              </td>
              <td>{s.id}</td>
              <td>{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
