// frontend/components/TimelineStrip.js
const MILS = [
  { key: "P1 Submitted", label: "P1 Submitted" },
  { key: "P1 Approved", label: "P1 Approved" },
  { key: "P3 Submitted", label: "P3 Submitted" },
  { key: "P3 Approved", label: "P3 Approved" },
  { key: "P4 Submitted", label: "P4 Submitted" },
  { key: "P4 Approved", label: "P4 Approved" },
  { key: "P5 Submitted", label: "P5 Submitted" },
  { key: "P5 Approved", label: "P5 Approved" },
];

function Badge({ done, date, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>
        {done ? "✓" : ""}
      </div>
      <div className="mt-2 text-sm text-center">{label}</div>
      <div className="text-xs text-gray-400 mt-1">{date || ""}</div>
    </div>
  );
}

export default function TimelineStrip({ raw = {} }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="overflow-x-auto">
        <div className="flex items-center gap-8 min-w-[800px]">
          {MILS.map((m) => {
            const v = raw[m.key];
            const done = !!(v && String(v).trim().length);
            return <Badge key={m.key} done={done} date={done ? v : null} label={m.label} />;
          })}
        </div>
      </div>
    </div>
  );
}
