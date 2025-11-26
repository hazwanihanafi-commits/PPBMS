// frontend/components/AnimatedTimeline.js
import CircularMilestoneProgress from "./CircularMilestoneProgress";
import EmailReminderButton from "./EmailReminderButton";
import GanttTimeline from "./GanttTimeline";

export default function AnimatedTimeline({ raw = {}, dueDates = {} }) {
  const milestones = [
    { key: "P1 Submitted", label: "P1" },
    { key: "P3 Submitted", label: "P3" },
    { key: "P4 Submitted", label: "P4" },
    { key: "P5 Submitted", label: "P5" },
  ];

  const completed = milestones.filter(m => raw[m.key]).length;

  const now = new Date();

  const statusFor = (m) => {
    const due = dueDates[m.key] ? new Date(dueDates[m.key]) : null;
    const submitted = raw[m.key] ? new Date(raw[m.key]) : null;

    if (submitted) {
      // submitted; check if late
      if (due && submitted > due) {
        return { color: "red", label: `Late by ${Math.round((submitted - due) / (1000*60*60*24))}d` };
      }
      return { color: "green", label: "Completed" };
    } else {
      if (due) {
        const daysLeft = Math.ceil((due - now) / (1000*60*60*24));
        if (daysLeft < 0) return { color: "red", label: `Overdue ${Math.abs(daysLeft)}d` };
        if (daysLeft <= 7) return { color: "yellow", label: `Due in ${daysLeft}d` };
        return { color: "gray", label: `Due ${due.toLocaleDateString()}` };
      }
      return { color: "gray", label: "Pending" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Milestone Progress</h2>
          <p className="text-sm text-gray-500">Overview of milestones & due status</p>
        </div>

        <CircularMilestoneProgress completed={completed} total={milestones.length} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {milestones.map(m => {
          const s = statusFor(m);
          return (
            <div key={m.key} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-lg font-medium">{m.label} <span className="text-sm text-gray-500">({m.key})</span></div>
                <div className="text-sm text-gray-600">Date: {raw[m.key] || "No date"}</div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-sm ${s.color === 'green' ? 'bg-green-100 text-green-700' : s.color==='red' ? 'bg-red-100 text-red-700' : s.color==='yellow' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>{s.label}</div>

                {
                  s.color === 'red' && (
                    <EmailReminderButton supervisorEmail={raw["Main Supervisor's Email"] || raw.main_supervisor || ""} studentName={raw["Student Name"] || raw.student_name || 'Student'} milestone={m.label} />
                  )
                }
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-semibold mb-3">Gantt Timeline</h3>
        <GanttTimeline raw={raw} dueMap={dueDates} />
      </div>
    </div>
  );
}
