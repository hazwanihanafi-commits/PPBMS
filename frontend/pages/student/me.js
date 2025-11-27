// pages/student/me.js (short snippet showing integration)
import DonutChart from '../../components/DonutChart';
import TimelineTable from '../../components/TimelineTable';
import MilestoneGantt from '../../components/MilestoneGantt';
...
// prepare `milestones` as earlier (array of {milestone, start, expected, actual})
...
<MilestoneGantt rows={milestones} width={800} />
<TimelineTable rows={milestones} />

const API = process.env.NEXT_PUBLIC_API_BASE;

// Expected timeline
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

  /* ---------------- LOAD TOKEN ---------------- */
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    setToken(t);
  }, []);

  /* ---------------- FETCH STUDENT DATA -------- */
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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-lg">Loading…</div>;

  if (error)
    return <div className="min-h-screen p-10 text-red-600 text-lg">Error: {error}</div>;

  if (!row) return null;

  /* ---------------- CALCULATE PROGRESS -------- */
  const completed = [
    row.raw["P1 Submitted"],
    row.raw["P3 Submitted"],
    row.raw["P4 Submitted"],
    row.raw["P5 Submitted"],
  ].filter(Boolean).length;

  const percentage = Math.round((completed / 4) * 100);

  /* ---------------- PREPARE TIMELINE TABLE -------- */
  const milestones = [
    { key: "P1 Submitted", label: "P1" },
    { key: "P3 Submitted", label: "P3" },
    { key: "P4 Submitted", label: "P4" },
    { key: "P5 Submitted", label: "P5" },
  ].map((m) => ({
    milestone: m.label,
    expected: DUE[m.key] || "—",
    actual: row.raw[m.key] || "—",
  }));

  const initials = (row.student_name || "NA")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="dashboard-container">
      
      {/* --------------------------------------------- */}
      {/* LEFT PANEL */}
      {/* --------------------------------------------- */}
      <div className="left-panel">

        {/* Gradient Header */}
        <div className="gradient-header">
          <h1 className="text-2xl font-bold">Student Progress</h1>
          <div className="mt-1 text-sm opacity-90">
            {row.student_name} — {row.programme}
          </div>
        </div>

        {/* Profile Card */}
        <div className="ppbms-card">
          <div className="flex items-center gap-4">
            <div className="profile-avatar">{initials}</div>
            <div>
              <div className="text-lg font-bold">{row.student_name}</div>
              <div className="ppbms-sub">{row.programme}</div>
            </div>
          </div>

          <div className="mt-5 text-sm">
            <div className="info-item">
              <strong>Supervisor:</strong> {row.main_supervisor}
            </div>
            <div className="info-item">
              <strong>Email:</strong>{" "}
              <a href={`mailto:${row.student_email}`} className="text-purple-700">
                {row.student_email}
              </a>
            </div>
            <div className="info-item">
              <strong>Status:</strong> {row.raw["Status P"] || "—"}
            </div>
          </div>
        </div>

      </div>

      {/* --------------------------------------------- */}
      {/* RIGHT PANEL */}
      {/* --------------------------------------------- */}
      <div className="right-panel">

        {/* Donut Progress */}
        <div className="ppbms-card">
          <div className="section-title">Overall Progress</div>
          <div className="donut-wrapper">
            <DonutChart percentage={percentage} size={170} />
            <div>
              <div className="text-4xl font-semibold">{percentage}%</div>
              <div className="mt-1 text-sm text-gray-600">
                {completed} of 4 milestones submitted
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Table */}
        <div className="ppbms-card">
          <div className="section-title">Expected vs Actual Timeline</div>
          <TimelineTable rows={milestones} />
        </div>

        {/* Activity Mapping Table */}
        <div className="ppbms-card">
          <div className="section-title">Activity → Milestone Mapping</div>
          <ActivityMapping />
        </div>

      </div>
    </div>
  );
}
