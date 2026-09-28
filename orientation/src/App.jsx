import { useEffect, useState } from "react";

import Welcome from "./pages/Welcome";
import Orientation from "./pages/Orientation";
import Completed from "./pages/Completed";

import {
  getStudentProfile,
  getOrientationStatus,
} from "./api";

export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem("ppbms_token")
  );

  const [student, setStudent] = useState(null);
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState("welcome");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // No PPBMS login → use the EXISTING PPBMS login
    if (!token) {
      window.top.location.href =
        "/login?returnTo=/orientation";
      return;
    }

    async function loadOrientation() {
      try {
        setLoading(true);
        setError("");

        console.log("ORIENTATION: checking PPBMS account");

        const profile =
          await getStudentProfile(token);

        console.log(
          "ORIENTATION: student profile",
          profile
        );

        const orientation =
          await getOrientationStatus(token);

        console.log(
          "ORIENTATION: status",
          orientation
        );

        setStudent(
          profile?.row || profile
        );

        setStatus(orientation);

        if (
          orientation?.status === "Completed"
        ) {
          setPage("completed");
        } else {
          setPage("welcome");
        }

      } catch (err) {
        console.error(
          "ORIENTATION ERROR:",
          err
        );

        // Token is invalid/expired
        localStorage.removeItem(
          "ppbms_token"
        );

        localStorage.removeItem(
          "ppbms_role"
        );

        localStorage.removeItem(
          "ppbms_email"
        );

        // Go to the REAL PPBMS login
        window.top.location.href =
          "/login?returnTo=/orientation";
      } finally {
        setLoading(false);
      }
    }

    loadOrientation();

  }, [token]);


  function logout() {
    localStorage.removeItem(
      "ppbms_token"
    );

    localStorage.removeItem(
      "ppbms_role"
    );

    localStorage.removeItem(
      "ppbms_email"
    );

    window.top.location.href =
      "/login";
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


  if (error) {
    return (
      <div className="loading-screen">

        <div className="loading-logo">
          PKTAAB
        </div>

        <h2>
          Orientation could not be loaded
        </h2>

        <p>
          {error}
        </p>

        <button
          className="primary-button"
          onClick={() =>
            window.location.reload()
          }
        >
          TRY AGAIN
        </button>

      </div>
    );
  }


  if (!student) {
    return (
      <div className="loading-screen">

        <div className="spinner"></div>

        <p>
          Student profile not found.
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
