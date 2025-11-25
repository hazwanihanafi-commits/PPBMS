import useSWR from "swr";
import { Chart } from "react-google-charts";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function Timeline() {
  const [token, setToken] = useState(null);

  // Load token only in browser
  useEffect(() => {
    setToken(localStorage.getItem("ppbms_token"));
  }, []);

  const fetcher = (url) =>
    fetch(url, {
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    }).then(async (r) => {
      if (!r.ok)
        throw new Error("HTTP " + r.status + ": " + (await r.text()));
      return r.json();
    });

  // Wait until token is loaded
  const { data, error } =
    token ? useSWR(`${API}/student/me`, fetcher) : { data: null, error: null };

  if (!token) return <div>Loading token...</div>;
  if (error) return <div>Error loading: {error.message}</div>;
  if (!data) return <div>Loading...</div>;

  const row = data.row;

  return (
    <div>
      <h2>My Timeline</h2>
      <div className="card">
        <strong>{row.student_name}</strong> ({row.programme})
        <br />
        Supervisor: {row.main_supervisor}
      </div>

      <Chart
        chartType="Gantt"
        width="100%"
        height="350px"
        data={[
          [
            { type: "string", label: "Task ID" },
            { type: "string", label: "Task Name" },
            { type: "date", label: "Start Date" },
            { type: "date", label: "End Date" },
          ],
          // add more Gantt rows here
        ]}
      />
    </div>
  );
}
