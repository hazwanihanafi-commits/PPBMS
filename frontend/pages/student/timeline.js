"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Chart } from "react-google-charts";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function Timeline() {
  const [token, setToken] = useState(null);

  // Load token from browser
  useEffect(() => {
    const t = localStorage.getItem("ppbms_token");
    setToken(t);
  }, []);

  // Still loading token
  if (token === null) return <div>Loading token...</div>;

  // No token → redirect to login
  if (!token) {
    window.location.href = "/login";
    return null;
  }

  // Authorized fetcher
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

  // Fetch student data
  const { data, error } = useSWR(`${API}/student/me`, fetcher);

  if (error) return <div>Error loading: {error.message}</div>;
  if (!data) return <div>Loading timeline...</div>;

  const row = data.row;

  return (
    <div style={{ padding: 20 }}>
      <h2>My Timeline</h2>

      <div className="card">
        <strong>{row.student_name}</strong> ({row.programme})
        <br />
        Supervisor: {row.main_supervisor}
      </div>

      <pre>{JSON.stringify(row, null, 2)}</pre>

      {/* You can add your Gantt chart below once data works */}
    </div>
  );
}
