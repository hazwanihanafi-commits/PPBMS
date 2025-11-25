import useSWR from "swr";
import { Chart } from "react-google-charts";

const API = process.env.NEXT_PUBLIC_API_BASE;

const fetcher = (url) =>
  fetch(url, {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("ppbms_token"),
    },
  }).then((r) => r.json());

export default function Timeline() {
  const { data, error } = useSWR(`${API}/student/me`, fetcher);

  if (error) return <div>Error loading: {JSON.stringify(error)}</div>;
  if (!data) return <div>Loading timeline...</div>;

  if (data.error) return <div>Error: {data.error}</div>;

  const row = data.row;

  const milestones = [
    "ETHICS",
    "PROPOSAL",
    "DATA1",
    "DATA2",
    "SEMINAR",
    "PROGRESS1",
    "THESIS",
  ].map((code) => ({
    code,
    title: code,
    start: row[`planned_${code}`] || null,
    end: row[`planned_${code}`] || row.start_date,
  })).filter(m => m.start);

  const chartData = [
    [
      { type: "string", label: "Task ID" },
      { type: "string", label: "Task Name" },
      { type: "date", label: "Start Date" },
      { type: "date", label: "End Date" },
    ],
  ];

  for (const m of milestones) {
    chartData.push([
      m.code,
      m.title,
      new Date(m.start),
      new Date(m.end),
    ]);
  }

  return (
    <div>
      <div className="card">
        <strong>{row.student_name}</strong> ({row.programme})<br />
        Supervisor: {row.main_supervisor}
      </div>

      <Chart
        chartType="Gantt"
        width="100%"
        height="350px"
        data={chartData}
      />
    </div>
  );
}
