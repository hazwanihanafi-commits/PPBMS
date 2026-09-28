import { useEffect, useState } from "react";

import Welcome from "./pages/Welcome";
import Orientation from "./pages/Orientation";
import Completed from "./pages/Completed";

import {
  getStudentProfile,
  getOrientationStatus,
} from "./api";

export default function App() {
  // Use the EXISTING PPBMS authentication
  const [token, setToken] = useState(
    localStorage.getItem("ppbms_token")
  );

  const [student, setStudent] = useState(null);
  const [status, setStatus] = useState(null);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState("welcome");

  useEffect(() => {
    const existingToken =
      localStorage.getItem("ppbms_token");

    // Student has NOT logged into PPBMS
    if (!existingToken) {
      setLoading(false);

      // Send them to the EXISTING PPBMS login
      window.location.href =
        "/login?returnTo=/orientation";

      return;
    }

    setToken(existingToken);

    async function loadStudent() {
      try {
        const profile =
          await getStudentProfile(existingToken);

        const orientation =
          await getOrientationStatus(existingToken);

        // /api/student/me returns { row: {...} }
        const studentData =
          profile?.row || profile;

        setStudent(studentData);
        setStatus(orientation);

        if (
          orientation?.status === "Completed"
        ) {
          setPage("completed");
        } else {
          setPage("welcome");
        }

      } catch (error) {
        console.error(
          "Orientation authentication error:",
          error
        );

        // Token is invalid/expired
        localStorage.removeItem("ppbms_token");
        localStorage.removeItem("ppbms_role");

        setToken(null);

        window.location.href =
          "/login?returnTo=/orientation";

      } finally {
        setLoading(false);
      }
    }

    loadStudent();

  }, []);


  function logout() {
    // Only remove PPBMS authentication
    localStorage.removeItem("ppbms_token");
    localStorage.removeItem("ppbms_role");

    setToken(null);
    setStudent(null);
    setStatus(null);
    setPage("welcome");

    window.location.href = "/login";
  }


  if (loading) {
    return (
      <div className="loading-screen">

        <div className="loading-logo">
          PKTAAB
        </div>

        <div className="spinner"></div>

        <p>
          Preparing your orientation...
        </p>

      </div>
    );
  }


  if (!token) {
    return (
      <div className="loading-screen">

        <div className="spinner"></div>

        <p>
          Redirecting to PPBMS login...
        </p>

      </div>
    );
  }


  if (!student) {
    return (
      <div className="loading-screen">

        <div className="spinner"></div>

        <p>
          Loading student profile...
        </p>

      </div>
    );
  }


  if (page === "completed") {
    return (
      <Completed
        student={student}
        status={status}
        onView={() =>
          setPage("orientation")
        }
        onLogout={logout}
      />
    );
  }


  if (page === "orientation") {
    return (
      <Orientation
        student={student}
        token={token}
        onComplete={() =>
          setPage("completed")
        }
      />
    );
  }


  return (
    <Welcome
      student={student}
      status={status}
      onStart={() =>
        setPage("orientation")
      }
      onLogout={logout}
    />
  );
}
