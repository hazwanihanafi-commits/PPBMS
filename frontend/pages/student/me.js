import { useEffect, useState } from "react";
<div className="max-w-6xl mx-auto p-6 space-y-6">
<div className="rounded-xl p-6 bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow-lg">
<h1 className="text-3xl font-bold">Student Progress</h1>
<p className="mt-2 text-lg"><strong>{row.student_name}</strong> — {row.programme}</p>
</div>


<div className="grid grid-cols-12 gap-6">
<div className="col-span-4 space-y-6">
<div className="rounded-xl bg-white p-6 shadow space-y-4">
<div className="flex items-center gap-4">
<div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 text-white text-xl font-bold">{initials}</div>
<div>
<div className="font-semibold text-lg">{row.student_name}</div>
<div className="text-gray-600 text-sm">{row.programme}</div>
</div>
</div>


<div className="text-sm space-y-1">
<div><strong>Supervisor:</strong> {row.supervisor || row.raw?.["Main Supervisor"] || "—"}</div>
<div><strong>Email:</strong> {row.email}</div>
<div><strong>Start Date:</strong> {row.start_date || "—"}</div>
<div><strong>Field:</strong> {row.field || "—"}</div>
<div><strong>Department:</strong> {row.department || "—"}</div>
</div>
</div>


<div className="rounded-xl bg-white shadow p-4">
<div className="flex gap-3 border-b pb-2 text-sm font-medium text-gray-600">
<button className={tab === "progress" ? "text-purple-700 font-bold" : ""} onClick={() => setTab("progress")}>Progress</button>
<button className={tab === "submissions" ? "text-purple-700 font-bold" : ""} onClick={() => setTab("submissions")}>Submissions</button>
<button className={tab === "reports" ? "text-purple-700 font-bold" : ""} onClick={() => setTab("reports")}>Reports</button>
<button className={tab === "documents" ? "text-purple-700 font-bold" : ""} onClick={() => setTab("documents")}>Documents</button>
</div>
</div>
</div>


<div className="col-span-8 space-y-6">
{tab === "progress" && (
<>
<div className="rounded-xl bg-white p-6 shadow flex items-center gap-6">
<DonutChart percentage={percentage} size={150} />
<div>
<div className="text-4xl font-bold">{percentage}%</div>
<div className="text-gray-600">{completedCount} of {totalCount} items completed</div>
</div>
</div>


<div className="rounded-xl bg-white p-6 shadow">
<h3 className="text-xl font-semibold text-purple-700 mb-4">Milestone Gantt Chart</h3>
<MilestoneGantt rows={activityRows} width={1000} />
</div>


<div className="rounded-xl bg-white p-6 shadow">
<h3 className="text-xl font-semibold text-purple-700 mb-4">Expected vs Actual Timeline</h3>
<TimelineTable rows={activityRows} />
</div>
</>
)}


{tab === "submissions" && <SubmissionFolder raw={row.raw} studentEmail={row.email} />}


{tab === "reports" && (
<div className="rounded-xl bg-white p-6 shadow text-gray-600">
<h3 className="text-xl font-semibold text-purple-700 mb-4">Reports</h3>
<p>No reports available yet.</p>
</div>
)}


{tab === "documents" && (
<div className="rounded-xl bg-white p-6 shadow space-y-3">
<h3 className="text-xl font-semibold text-purple-700 mb-4">Documents</h3>
<a target="_blank" rel="noreferrer" className="text-purple-600 hover:underline block" href="https://gamma.app/docs/PPBMS-Student-Progress-Dashboard-whsfuidye58swk3?mode=doc">PPBMS Student Progress Dashboard (Doc)</a>
</div>
)}
</div>
</div>
</div>
);
}

