// pages/student/me.js
import { useEffect, useState } from "react";
import GradientCard from "../../components/GradientCard";
import ProfileCard from "../../components/ProfileCard";
import DonutChart from "../../components/DonutChart";
import TimelineTable from "../../components/TimelineTable";
import ActivityMapping from "../../components/ActivityMapping";

const API = process.env.NEXT_PUBLIC_API_BASE;

// example DUE map
const DUE = {
  "P1 Submitted": "2024-08-31",
  "P3 Submitted": "2025-01-31",
  "P4 Submitted": "2025-02-15",
  "P5 Submitted": "2025-10-01",
};

export default function MePage() {
  const [token, setToken] = useState(null);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // load token
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      setLoading(false);
      setError("Not authenticated");
      return;
    }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`${API}/api/student/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();
        setRow(data.row);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load student");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <div style={{padding:40}}>Loading…</div>;
  if (error) return <div style={{padding:40}}>Error: {error}</div>;
  if (!row) return null;

  // progress calculation
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;
  const percentage = Math.round((completed / 4) * 100);

  const milestones = [
    { key: "P1 Submitted", label: "P1", expected: DUE["P1 Submitted"] },
    { key: "P3 Submitted", label: "P3", expected: DUE["P3 Submitted"] },
    { key: "P4 Submitted", label: "P4", expected: DUE["P4 Submitted"] },
    { key: "P5 Submitted", label: "P5", expected: DUE["P5 Submitted"] },
  ].map(m => ({
    label: m.label,
    expected: m.expected,
    actual: row.raw[m.key] || null
  }));

  return (
    <div style={{padding:20}}>
      <div className="ppbms-header">
        <div style={{maxWidth:1100, margin:'0 auto'}}>
          <h1 style={{fontSize:32, margin:0, fontWeight:800}}>PPBMS Student Progress</h1>
          <div style={{marginTop:8, opacity:0.95}}>{row.student_name} — {row.programme}</div>
        </div>
      </div>

      <div style={{maxWidth:1100, margin:'22px auto'}} className="dashboard-grid">
        {/* left column */}
        <div style={{display:'flex', flexDirection:'column', gap:18}}>
          <ProfileCard
            name={row.student_name}
            programme={row.programme}
            supervisor={row.main_supervisor}
            email={row.student_email}
            status={row.raw["Status P"]}
          />

          <GradientCard>
            <div>
              <div className="section-heading">Summary</div>
              <div style={{marginTop:6}}>
                <div><strong>Milestones Completed:</strong> {completed} / 4</div>
                <div style={{marginTop:6}}><strong>Last Submission:</strong> {row.raw["P5 Submitted"] || row.raw["P4 Submitted"] || '—'}</div>
                <div style={{marginTop:6}}><strong>Overall Status:</strong> {row.raw["Status P"] || '—'}</div>
              </div>

              <div style={{marginTop:14}} className="donut-wrap">
                <div style={{width:180,height:180}}><DonutChart percentage={percentage} size={180} /></div>
                <div>
                  <div style={{fontWeight:700, color:'#5e2a84'}}>Progress</div>
                  <div className="muted small" style={{marginTop:6}}>Overview of milestones completed</div>
                  <div style={{marginTop:14, fontWeight:700, fontSize:20}}>{percentage}%</div>
                </div>
              </div>
            </div>
          </GradientCard>
        </div>

        {/* right column */}
        <div style={{display:'flex', flexDirection:'column', gap:18}}>
          <GradientCard>
            <div className="section-heading">Expected vs Actual Timeline</div>
            <TimelineTable rows={milestones} supervisor={row.main_supervisor} />
          </GradientCard>

          <GradientCard>
            <div className="section-heading">Activity → Milestone mapping</div>
            <ActivityMapping />
          </GradientCard>

        </div>
      </div>
    </div>
  );
}
