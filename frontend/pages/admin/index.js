import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../../utils/api";

/* ============================
   ADMIN DASHBOARD
============================ */
export default function AdminDashboard() {
  const router = useRouter();

  const [programmes, setProgrammes] = useState([]);
  const [programme, setProgramme] = useState("");

  const [plo, setPlo] = useState(null);
  const [students, setStudents] = useState([]);

  const [loadingProgrammes, setLoadingProgrammes] = useState(true);
  const [loadingCQI, setLoadingCQI] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  /* ============================
     AUTH GUARD (ADMIN ONLY)
  ============================ */
  useEffect(() => {
    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");

    if (!token || role !== "admin") {
      router.replace("/admin/login");
    }
  }, []);

  /* ============================
     LOAD PROGRAMMES
  ============================ */
  useEffect(() => {
    async function loadProgrammes() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/programmes`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
          },
        });
        const data = await res.json();

        setProgrammes(data.programmes || []);
        if (data.programmes?.length) {
          setProgramme(data.programmes[0]);
        }
      } catch (e) {
        console.error("Programme load error:", e);
      } finally {
        setLoadingProgrammes(false);
      }
    }

    loadProgrammes();
  }, []);

  /* ============================
     LOAD PROGRAMME CQI
  ============================ */
  useEffect(() => {
    if (!programme) return;

    async function loadCQI() {
      setLoadingCQI(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/admin/programme-plo?programme=${encodeURIComponent(
            programme
          )}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
            },
          }
        );
        const data = await res.json();
        setPlo(data.plo || null);
      } catch (e) {
        console.error("CQI error:", e);
        setPlo(null);
      } finally {
        setLoadingCQI(false);
      }
    }

    loadCQI();
  }, [programme]);

  /* ============================
     LOAD STUDENTS
  ============================ */
  useEffect(() => {
    if (!programme) return;

    async function loadStudents() {
      setLoadingStudents(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/admin/programme-students?programme=${encodeURIComponent(
            programme
          )}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("ppbms_token")}`,
            },
          }
        );
        const data = await res.json();
        setStudents(data.students || []);
      } catch (e) {
        console.error("Student list error:", e);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, [programme]);

  /* ============================
     LATE / ON TRACK LOGIC
  ============================ */
  function getProgressBadge(student) {
    if (student.status !== "Active") return null;

    return (
      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
        On Track
      </span>
    );
  }

  /* ============================
     RENDER
  ============================ */
  return (
    <div className="min-h-screen bg-purple-50 p-6 space-y-6">
      <h1 className="text-3xl font-extrabold text-purple-900">
        Admin Dashboard
      </h1>

      {/* ================= PROGRAMME SELECT ================= */}
      <div className="bg-white p-4 rounded-xl shadow">
        <label className="block text-sm font-semibold mb-2">
          Select Programme
        </label>

        {loadingProgrammes ? (
          <p className="text-sm text-gray-500">Loading programmes…</p>
        ) : (
          <select
            value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            {programmes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ================= PROGRAMME CQI ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">
          Programme CQI (Graduated Students)
        </h2>

        {loadingCQI && <p className="text-sm text-gray-500">Loading CQI…</p>}

        {!loadingCQI && !plo && (
          <p className="text-sm text-gray-500">No CQI data available</p>
        )}

        {plo &&
          Object.entries(plo).map(([key, d]) => (
            <div key={key} className="mb-4">
              <div className="flex justify-between text-sm font-semibold">
                <span>{key}</span>
                <span>
                  {d.percent ?? "-"}% ({d.achieved}/{d.assessed})
                </span>
              </div>

              <div className="w-full bg-gray-200 h-2 rounded mt-1">
                <div
                  className={`h-2 rounded ${
                    d.status === "Achieved"
                      ? "bg-green-500"
                      : d.status === "Borderline"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(d.percent || 0, 100)}%` }}
                />
              </div>

              <p className="text-xs mt-1 text-gray-600">
                Status: <strong>{d.status}</strong>
              </p>
            </div>
          ))}
      </div>

      {/* ================= STUDENT LIST ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">
          Students ({students.length})
        </h2>

        {loadingStudents && (
          <p className="text-sm text-gray-500">Loading students…</p>
        )}

        {!loadingStudents && students.length === 0 && (
          <p className="text-sm text-gray-500">No students found</p>
        )}

        {!loadingStudents && students.length > 0 && (
          <table className="w-full text-sm border">
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
                <tr key={i} className="border-t hover:bg-purple-50">
                  <td className="p-2 font-medium text-purple-700">
                    <a
                      href={`/supervisor/${encodeURIComponent(s.email)}`}
                      className="hover:underline"
                    >
                      {s.email}
                    </a>
                  </td>
                  <td className="p-2">{s.id}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        s.status === "Graduated"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-2">{getProgressBadge(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
