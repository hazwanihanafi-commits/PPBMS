import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function Card({ children }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
      {children}
    </div>
  );
}

export default function SupervisorStudentPage() {
  const router = useRouter();
  const { email } = router.query;

  const [loading, setLoading] = useState(true);

  const [student, setStudent] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [cqi, setCqi] = useState({});

  const [activeTab, setActiveTab] = useState("overview");

  // ================= LOAD DATA =================
  useEffect(() => {
    if (!email) return;

    const load = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`
        );

        const data = await res.json();

        setStudent(data.student || {});
        setTimeline(Array.isArray(data.timeline) ? data.timeline : []);
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
        setRemarks(Array.isArray(data.remarks) ? data.remarks : []);
        setCqi(data.cqi || {});
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [email]);

  // ================= CQI TRANSFORM =================
  const cqiChartData = [];

  Object.entries(cqi || {}).forEach(([assessment, plos]) => {
    Object.entries(plos).forEach(([plo, val]) => {
      cqiChartData.push({
        name: `${assessment}-${plo}`,
        value: val.average || 0,
      });
    });
  });

  // ================= SAVE REMARK =================
  const saveRemark = async (id, text) => {
    await fetch(`${API_BASE}/api/remarks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remark: text }),
    });
  };

  if (loading) return <p className="p-6">Loading...</p>;

  const completed = timeline.filter(t => t.status === "COMPLETED").length;
  const delayed = timeline.filter(t => t.status === "AT_RISK").length;

  return (
    <div className="flex min-h-screen">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#0f172a] text-white p-6">
        <h2 className="font-bold mb-6">PPBMS</h2>

        {["overview", "timeline", "documents", "remarks", "cqi"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`block w-full text-left px-4 py-2 rounded-lg mb-2 ${
              activeTab === tab ? "bg-purple-600" : ""
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6 bg-gray-100">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white p-6 rounded-2xl mb-6">
          <h1 className="text-2xl font-bold">Student Monitoring Dashboard</h1>
          <p>{student.name}</p>
        </div>

        {/* ================= OVERVIEW ================= */}
        {activeTab === "overview" && (
          <>
            <Card>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p>Completed</p>
                  <h2 className="text-green-600 text-xl">{completed}</h2>
                </div>
                <div>
                  <p>Delayed</p>
                  <h2 className="text-orange-500 text-xl">{delayed}</h2>
                </div>
                <div>
                  <p>Status</p>
                  <h2 className="text-blue-600 text-xl">
                    {student.status || "-"}
                  </h2>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold">Status Analytics</h3>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { name: "Completed", value: completed },
                    { name: "Delayed", value: delayed },
                  ]}
                >
                  <XAxis dataKey="name" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}

        {/* ================= TIMELINE ================= */}
        {activeTab === "timeline" && (
          <Card>
            <h3 className="mb-6 font-semibold">
              Milestone Timeline ({timeline.length})
            </h3>

            <div className="border-l-2 ml-4 space-y-6">
              {(Array.isArray(timeline) ? timeline : []).map((t, i) => {
                const done = t.status === "COMPLETED";

                return (
                  <div key={i} className="ml-6">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        done ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />

                    <div className="bg-gray-50 p-4 rounded-xl mt-2">
                      <p className="font-semibold">{t.activity}</p>
                      <p className="text-sm">
                        Expected: {t.expected_date || "-"}
                      </p>
                      <p className="text-sm">
                        Completed: {t.completed_date || "-"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ================= DOCUMENTS ================= */}
        {activeTab === "documents" && (
          <Card>
            <h3 className="mb-4 font-semibold">Documents</h3>

            {!documents.length && <p>No documents</p>}

            {(Array.isArray(documents) ? documents : []).map((d, i) => (
              <div key={i} className="border p-4 rounded-xl mb-3">
                <p className="font-semibold">{d.document_name}</p>
                <p className="text-sm text-gray-500">
                  Status: {d.status}
                </p>

                <a
                  href={d.file_url}
                  target="_blank"
                  className="text-purple-600"
                >
                  View
                </a>
              </div>
            ))}
          </Card>
        )}

        {/* ================= REMARKS ================= */}
        {activeTab === "remarks" && (
          <Card>
            <h3 className="mb-4 font-semibold">Remarks</h3>

            {(Array.isArray(remarks) ? remarks : []).map((r, i) => (
              <div key={i} className="mb-4">
                <p className="font-semibold">{r.assessmentType}</p>

                <textarea
                  defaultValue={r.remark}
                  className="w-full border p-2 rounded mt-2"
                  onBlur={(e) => saveRemark(r.id, e.target.value)}
                />

                <p className="text-xs text-gray-400 mt-1">
                  CQI:{" "}
                  {cqi?.[r.assessmentType]?.PLO1?.status || "-"}
                </p>
              </div>
            ))}
          </Card>
        )}

        {/* ================= CQI ================= */}
        {activeTab === "cqi" && (
          <Card>
            <h3 className="mb-4 font-semibold">CQI Analytics</h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cqiChartData}>
                <XAxis dataKey="name" />
                <Tooltip />
                <Bar dataKey="value" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}
