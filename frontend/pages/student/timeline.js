import { useEffect, useState } from "react";
import useSWR from "swr";
import { Chart } from "react-google-charts";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function Timeline() {
  const [token, setToken] = useState(null);

  // Load token on client side only
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    setToken(t);
  }, []);

  // While loading token → show loading
  if (token === null) {
    return <div>Loading token...</div>;
  }

  // IF no token → force login
  if (!token) {
    window.location.href = "/login";
    return null;
  }

  // Fetcher runs only after token exists
  const fetcher = (url) =>
    fetch(url, {
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    });

  const { data, error } = useSWR(`${API}/student/me`, fetcher);

  if (error) return <div>Error loading: {error.message}</div>;
  if (!data) return <div>Loading timeline...</div>;

  const row = data.row;

  const milestones = [
    "ETHICS",
    "PROPOSAL",
    "DATA1",
    "DATA2",
    "SEMINAR",
    "PROGRESS1",
    "THESIS",
  ]
    .map((code) => ({
      code,
      title: code,
      start: row[`planned_${code}`] || null,
      end: row[`planned_${code}`] || row.start_date,
    }))
    .filter((m) => m.start);

  const chartData = [
    [
      { type: "string", label: "Task ID" },
      { type: "string", label: "Task Name" },
      { type: "date", label: "Start Date" },
      { type: "date", label: "End Date" },
    ],
  ];

  milestones.forEach((m) => {
    chartData.push([
      m.code,
      m.title,
      new Date(m.start),
      new Date(m.end),
    ]);
  });

  return (
    <div>
      <h2>My Timeline</h2>
      <div className="card">
        <strong>{row.student_name}</strong> ({row.programme})  
        <br />
        Supervisor: {row.main_supervisor}
      </div>

      <Chart chartType="Gantt" width="100%" height="350px" data={chartData} />
    </div>
  );
}
