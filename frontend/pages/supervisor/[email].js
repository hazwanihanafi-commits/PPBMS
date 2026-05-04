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

/* ================= UI COMPONENTS ================= */

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition ${
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

/* ================= MAIN PAGE ================= */

export default function Page({ params }) {

  const [student, setStudent] = useState(null);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const [documents, setDocuments] = useState([]);
  const [remarks, setRemarks] = useState([]);

  const [newRemark, setNewRemark] = useState({
    type: "",
    instance: "",
    text: ""
  });

  /* ================= LOAD DATA ================= */

  async function loadStudent() {
    try {
      const token = localStorage.getItem("ppbms_token");

      const res = await fetch(
        `${API_BASE}/api/supervisor/student/${params.email}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();

      const row = data?.row || {};

      setStudent(row);

      /* SAFE DOCUMENT PARSE */
      const docsObj = row?.documents || {};
      const docs = Object.entries(docsObj).map(([name, d]) => ({
        name,
        url: d?.url || "#",
        status: d?.status || "Pending",
        feedback: d?.feedback || ""
      }));

      setDocuments(docs);

      setRemarks(row?.remarksByAssessment || []);

    } catch (err) {
      console.error("Load error:", err);
    }
  }

  useEffect(() => {
    loadStudent();
  }, []);

  if (!student) return <p className="p-6">Loading...</p>;

  /* ================= DERIVED ================= */

  const timeline = Array.isArray(student.timeline)
    ? student.timeline
    : [];

  const graduated =
    student?.status?.toLowerCase() === "graduated";

  const completed = timeline.filter(t => t?.status === "COMPLETED").length;
  const pending = timeline.filter(t => t?.status === "PENDING").length;
  const atRisk = timeline.filter(t => t?.status === "AT_RISK").length;

  /* ================= API ACTIONS ================= */

  async function updateDocument(doc, status) {
    try {
      const token = localStorage.getItem("ppbms_token");

      await fetch(`${API_BASE}/api/supervisor/document-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentEmail: student.email,
          document_key: doc.name,
          status,
          feedback: doc.feedback || ""
        })
      });

      loadStudent();
    } catch (err) {
      console.error("Document update error:", err);
    }
  }

  async function saveRemark() {
    if (!newRemark.text) return alert("Enter remark");

    try {
      const token = localStorage.getItem("ppbms_token");

      await fetch(`${API_BASE}/api/supervisor/remark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentEmail: student.email,
          assessmentType: newRemark.type || "GENERAL",
          assessmentInstance: newRemark.instance || "",
          remark: newRemark.text
        })
      });

      setNewRemark({ type: "", instance: "", text: "" });

      loadStudent();

    } catch (err) {
      console.error("Remark save error:", err);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#0f172a] p-5 text-white">
        <h1 className="text-xl font-bold mb-6">PPBMS</h1>

        <div className="space-y-2">
          <SidebarItem label="Dashboard" icon={<LayoutDashboard size={18} />} active={activeMenu==="dashboard"} onClick={()=>setActiveMenu("dashboard")} />
          <SidebarItem label="Progress" icon={<BarChart3 size={18} />} active={activeMenu==="progress"} onClick={()=>setActiveMenu("progress")} />
          <SidebarItem label="Milestones" icon={<ClipboardList size={18} />} active={activeMenu==="milestones"} onClick={()=>setActiveMenu("milestones")} />
          <SidebarItem label="Documents" icon={<FileText size={18} />} active={activeMenu==="documents"} onClick={()=>setActiveMenu("documents")} />
          <SidebarItem label="Remarks" icon={<Bell size={18} />} active={activeMenu==="remarks"} onClick={()=>setActiveMenu("remarks")} />
          <SidebarItem label="CQI" icon={<AlertTriangle size={18} />} active={activeMenu==="cqi"} onClick={()=>setActiveMenu("cqi")} />
        </div>
      </div>

      {/* MAIN */}
      <main className="flex-1 p-8 space-y-6">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-3xl">
          <h2 className="text-3xl font-bold">Student Monitoring Dashboard</h2>
          <p className="text-sm mt-1">Track postgraduate progress</p>
        </div>

        {/* DASHBOARD */}
        {activeMenu === "dashboard" && (
          <Card>

            <div className="grid md:grid-cols-2 gap-5">

              <SummaryCard
                title="Completed"
                value={`${completed}/${timeline.length}`}
                color="bg-green-100"
                icon={<CheckCircle2 className="text-green-600" />}
              />

              <SummaryCard
                title="Status"
                value={student.status || "-"}
                color={graduated ? "bg-green-100" : "bg-red-100"}
                icon={
                  graduated
                    ? <CheckCircle2 className="text-green-600" />
                    : <AlertTriangle className="text-red-600" />
                }
              />

            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-3 text-sm">
              <p><b>Name:</b> {student.student_name}</p>
              <p><b>Programme:</b> {student.programme}</p>
              <p><b>Field:</b> {student.field}</p>
              <p><b>Co-Supervisors:</b> {(student.coSupervisors || []).join(", ")}</p>
            </div>

          </Card>
        )}

        {/* PROGRESS */}
        {activeMenu === "progress" && (
          <Card>

            <h3 className="text-xl font-bold mb-4">Progress Summary</h3>

            <div className="grid md:grid-cols-3 gap-5">

              <SummaryCard title="Completed" value={completed} color="bg-green-100" icon={<CheckCircle2 />} />
              <SummaryCard title="Pending" value={pending} color="bg-orange-100" icon={<Clock3 />} />

              {!graduated && (
                <SummaryCard title="At Risk" value={atRisk} color="bg-red-100" icon={<AlertTriangle />} />
              )}

            </div>

          </Card>
        )}

        {/* MILESTONES */}
        {activeMenu === "milestones" && (
          <Card>

            <h3 className="text-xl font-bold mb-4">
              Milestones ({timeline.length})
            </h3>

            <div className="space-y-3">

              {timeline.map((t, i) => {

                const s = t?.status;

                const color =
                  s === "COMPLETED"
                    ? "bg-green-500"
                    : s === "AT_RISK"
                    ? "bg-red-500"
                    : "bg-gray-400";

                return (
                  <div key={i} className="flex items-center gap-3">

                    <div className={`w-4 h-4 rounded-full ${color}`} />

                    <div className="flex-1 flex justify-between border rounded-xl p-3">
                      <span>{t?.activity}</span>
                      <span className="text-sm">{t?.status}</span>
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

            {documents.length === 0 && (
              <p className="text-gray-500">No documents</p>
            )}

            {documents.map((doc, i) => (
              <div key={i} className="border p-4 rounded-xl mb-3">

                <div className="flex justify-between">
                  <p className="font-semibold">{doc.name}</p>
                  <p>{doc.status}</p>
                </div>

                <textarea
                  className="w-full border mt-3 p-2 rounded"
                  value={doc.feedback}
                  onChange={(e) => {
                    const copy = [...documents];
                    copy[i].feedback = e.target.value;
                    setDocuments(copy);
                  }}
                />

                <div className="flex gap-2 mt-3">

                  <a href={doc.url} target="_blank" className="px-3 py-1 bg-purple-100 rounded">
                    View
                  </a>

                  <button onClick={()=>updateDocument(doc,"Approved")} className="px-3 py-1 bg-green-100 rounded">
                    Approve
                  </button>

                  <button onClick={()=>updateDocument(doc,"Revision Required")} className="px-3 py-1 bg-orange-100 rounded">
                    Revise
                  </button>

                </div>

              </div>
            ))}

          </Card>
        )}

        {/* REMARKS */}
        {activeMenu === "remarks" && (
          <Card>

            <h3 className="text-xl font-bold mb-4">Remarks</h3>

            <input
              placeholder="Assessment Type"
              value={newRemark.type}
              onChange={(e)=>setNewRemark({...newRemark,type:e.target.value})}
              className="border p-2 rounded w-full mb-2"
            />

            <textarea
              placeholder="Enter remark"
              value={newRemark.text}
              onChange={(e)=>setNewRemark({...newRemark,text:e.target.value})}
              className="border p-2 rounded w-full mb-2"
            />

            <button onClick={saveRemark} className="bg-purple-600 text-white px-4 py-2 rounded">
              Save Remark
            </button>

            <div className="mt-4 space-y-2">

              {remarks.map((r,i)=>(
                <div key={i} className="border p-3 rounded">

                  <p className="font-semibold">
                    {r?.assessmentType}
                  </p>

                  <p className="text-sm text-gray-500">
                    {r?.assessmentInstance}
                  </p>

                  <p>{r?.remark}</p>

                </div>
              ))}

            </div>

          </Card>
        )}

        {/* CQI */}
        {activeMenu === "cqi" && (
          <Card>

            <h3 className="text-xl font-bold mb-4">CQI Analytics</h3>

            {Object.entries(student.cqiByAssessment || {}).map(([k,v])=>(
              <div key={k} className="border p-3 mb-3 rounded">

                <p className="font-bold">{k}</p>

                {Object.entries(v).map(([plo,data])=>(
                  <p key={plo}>
                    {plo}: {data.average} ({data.status})
                  </p>
                ))}

              </div>
            ))}

          </Card>
        )}

      </main>
    </div>
  );
}
