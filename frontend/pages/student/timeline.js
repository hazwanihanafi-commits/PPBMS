import { useEffect, useState } from "react";
import useSWR from "swr";
import { Chart } from "react-google-charts";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function Timeline() {
  const [token, setToken] = useState(null);

  // Ensure token loaded BEFORE SWR
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    if (!t) {
      window.location.href = "/login";
    } else {
      setToken(t);
    }
  }, []);

  const fetcher = (url) =>
    fetch(url, {
      headers: { Authorization: "Bearer " + token },
    }).then(async (r) => {
      if (!r.ok) throw new Error("HTTP " + r.status + ": " + (await r.text()));
      return r.json();
    });

  const { data, error } = useSWR(token ? `${API}/student/me` : null, fetcher);

  if (!token) return <div>Loading token...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>Loading...</div>;

  const row = data.row;

  return (
    <div>
      <h2>My Timeline</h2>
      <div className="card">
        <strong>{row.student_name}</strong> ({row.programme}) <br />
        Supervisor: {row.main_supervisor}
      </div>
      <p>Timeline coming soon…</p>
    </div>
  );
}
