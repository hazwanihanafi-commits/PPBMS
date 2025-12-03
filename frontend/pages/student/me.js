import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiGet } from "../../utils/api";
import SubmissionFolder from "../../components/SubmissionFolder";

export default function StudentProfile() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    apiGet("/student/me").then((res) => {
      if (res.error) {
        setErr(res.error);
        if (res.error === "No token" || res.error === "Invalid token") {
          router.push("/login");
        }
      } else {
        setData(res.row);
      }
    });
  }, []);

  if (err) return <div>Error: {err}</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: 40 }}>
      <h2>Student Progress</h2>
      <p><b>{data.student_name}</b></p>

      <div style={{ marginTop: 30 }}>
        <SubmissionFolder raw={data.raw} studentEmail={data.email} />
      </div>
    </div>
  );
}
