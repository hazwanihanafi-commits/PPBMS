"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  FileText,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock3
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ================= UI ================= */

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer ${
        active
          ? "bg-purple-600 text-white"
          : "text-gray-300 hover:bg-gray-800"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

function Card({ children }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      {children}
    </div>
  );
}

function SummaryCard({ title, value, color, icon }) {
  return (
    <div className="flex justify-between items-center p-5 rounded-2xl border">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function Page({ params }) {

  const email = params?.email;

  /* ===== STATES ===== */

  const [student, setStudent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [cqi, setCqi] = useState({});
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const [newRemark, setNewRemark] = useState({
    type: "",
    instance: "",
    text: ""
  });

  /* ================= LOAD ================= */

  async function loadStudent() {
    try {
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${encodeURIComponent(email)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();
      const row = data.row || {};

      setStudent(row);
      setTimeline(row.timeline || []);
      setRemarks(row.remarks || []);
      setCqi(row.cqiByAssessment || {});

      setDocuments(
        Object.entries(row.documents || {}).map(([name, d]) => ({
          name,
          status: d.status,
          url: d.url,
          feedback: d.feedback || ""
        }))
      );

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!email) return;
    loadStudent();
  }, [email]);

  if (loading) return <div className="p-10">Loading...</div>;

  const graduated =
    (student?.status || "").toUpperCase() === "GRADUATED";

  const completed = timeline.filter(t => t.status === "COMPLETED").length;
  const pending = timeline.filter(t => t.status === "PENDING").length;
  const atRisk = timeline.filter(t => t.status === "AT_RISK").length;

  /* ================= ACTIONS ================= */

  async function updateDocument(doc, status) {
    const token = localStorage.getItem("ppbms_token");

    await fetch(`${API_BASE}/api/supervisor/document-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        studentEmail: email,
        document_key: doc.name,
        status,
        feedback: doc.feedback || ""
      })
    });

    setDocuments(prev =>
      prev.map(d =>
        d.name === doc.name ? { ...d, status } : d
      )
    );
  }

  async function saveRemark() {
    const token = localStorage.getItem("ppbms_token");

    await fetch(`${API_BASE}/api/supervisor/remark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        studentEmail: email,
        assessmentType: newRemark.type || "GENERAL",
        assessmentInstance: newRemark.instance || "",
        remark: newRemark.text
      })
    });

    alert("Remark saved");
    setNewRemark({ type: "", instance: "", text: "" });
    loadStudent();
  }

  /* ================= UI ================= */

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#0f172a] p-5 text-white">
        <h1 className="text-xl font-bold mb-6">PPBMS</h1>

        <div className="space-y-2">
          <SidebarItem label="Dashboard" icon={<LayoutDashboard />} active={activeMenu==="dashboard"} onClick={()=>setActiveMenu("dashboard")} />
          <SidebarItem label="Progress" icon={<BarChart3 />} active={activeMenu==="progress"} onClick={()=>setActiveMenu("progress")} />
          <SidebarItem label="Milestones" icon={<ClipboardList />} active={activeMenu==="milestones"} onClick={()=>setActiveMenu("milestones")} />
          <SidebarItem label="Documents" icon={<FileText />} active={activeMenu==="documents"} onClick={()=>setActiveMenu("documents")} />
          <SidebarItem label="Remarks" icon={<Bell />} active={activeMenu==="remarks"} onClick={()=>setActiveMenu("remarks")} />
          <SidebarItem label="CQI" icon={<AlertTriangle />} active={activeMenu==="cqi"} onClick={()=>setActiveMenu("cqi")} />
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-1 p-8 space-y-6">

        {/* DASHBOARD */}
        {activeMenu === "dashboard" && (
          <Card>
            <div className="grid md:grid-cols-3 gap-5">
              <SummaryCard title="Completed" value={`${completed}/${timeline.length}`} color="bg-green-100" icon={<CheckCircle2 />} />
              <SummaryCard title="Pending" value={pending} color="bg-orange-100" icon={<Clock3 />} />
              {!graduated && (
                <SummaryCard title="At Risk" value={atRisk} color="bg-red-100" icon={<AlertTriangle />} />
              )}
            </div>
          </Card>
        )}

        {/* MILESTONE TIMELINE */}
        {activeMenu === "milestones" && (
          <Card>
            <h3 className="text-xl font-bold mb-6">Milestones</h3>

            <div className="relative border-l-2 pl-6 space-y-6">

              {timeline.map((t, i) => {
                const color =
                  t.status === "COMPLETED"
                    ? "bg-green-500"
                    : t.status === "AT_RISK"
                    ? "bg-red-500"
                    : t.status === "PENDING"
                    ? "bg-orange-500"
                    : "bg-gray-400";

                return (
                  <div key={i} className="relative">

                    <div className={`absolute -left-3 w-5 h-5 rounded-full ${color}`} />

                    <div className="border rounded-xl p-4 bg-white">
                      <div className="flex justify-between">
                        <p className="font-semibold">{t.activity}</p>
                        <span className="text-sm">{t.status}</span>
                      </div>
                    </div>

                  </div>
                );
              })}

            </div>
          </Card>
        )}

        {/* DOCUMENTS */}
        {activeMenu === "documents" && (
          <Card>
            <h3 className="text-xl font-bold mb-4">Documents</h3>

            {documents.map((doc, i) => (
              <div key={i} className="border p-4 rounded-xl mb-3">

                <div className="flex justify-between">
                  <p>{doc.name}</p>
                  <p>{doc.status}</p>
                </div>

                <textarea
                  value={doc.feedback}
                  onChange={(e) => {
                    const copy = [...documents];
                    copy[i].feedback = e.target.value;
                    setDocuments(copy);
                  }}
                  className="w-full border mt-2 p-2 rounded"
                />

                <div className="flex gap-2 mt-2">
                  <button onClick={()=>updateDocument(doc,"Approved")}>Approve</button>
                  <button onClick={()=>updateDocument(doc,"Revision Required")}>Revise</button>
                </div>

              </div>
            ))}

          </Card>
        )}

        {/* REMARKS */}
        {activeMenu === "remarks" && (
          <Card>

            <input
              placeholder="Type"
              value={newRemark.type}
              onChange={(e)=>setNewRemark({...newRemark,type:e.target.value})}
              className="border p-2 w-full mb-2"
            />

            <textarea
              placeholder="Remark"
              value={newRemark.text}
              onChange={(e)=>setNewRemark({...newRemark,text:e.target.value})}
              className="border p-2 w-full mb-2"
            />

            <button onClick={saveRemark}>Save</button>

          </Card>
        )}

        {/* CQI */}
        {activeMenu === "cqi" && (
          <Card>
            <h3 className="text-xl font-bold mb-4">CQI Analytics</h3>

            {Object.entries(cqi || {}).map(([k, v]) => (
              <div key={k} className="mb-4">

                <p className="font-bold mb-2">{k}</p>

                {Object.entries(v).map(([plo, data]) => (
                  <div key={plo} className="mb-2">

                    <div className="flex justify-between text-sm">
                      <span>{plo}</span>
                      <span>{data.average}</span>
                    </div>

                    <div className="bg-gray-200 h-2 rounded">
                      <div
                        className="bg-purple-500 h-2 rounded"
                        style={{ width: `${(data.average / 4) * 100}%` }}
                      />

                    </div>

                  </div>
                ))}

              </div>
            ))}

          </Card>
        )}

      </main>
    </div>
  );
}
