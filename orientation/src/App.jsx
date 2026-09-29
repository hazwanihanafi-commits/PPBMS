import { useEffect, useState } from "react";

import Welcome from "./pages/Welcome";
import Orientation from "./pages/Orientation";
import Completed from "./pages/Completed";

import {
  getStudentProfile,
  getOrientationStatus,
} from "./api";

export default function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("ppbms_token")
  );

  const [student, setStudent] = useState(null);
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState("welcome");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // No PPBMS login → use the existing PPBMS login
    if (!token) {
      window.top.location.href =
        "/login?returnTo=/orientation";
      return;
    }

    async function loadOrientation() {
      try {
        setLoading(true);
        setError("");

        console.log(
          "ORIENTATION: checking PPBMS account"
        );

        // ---------------------------------------------
        // 1. GET STUDENT PROFILE
        // ---------------------------------------------

        const profile =
          await getStudentProfile(token);

        console.log(
          "ORIENTATION: student profile",
          profile
        );

        // ---------------------------------------------
        // 2. GET ORIENTATION STATUS
        // ---------------------------------------------

        const orientation =
          await getOrientationStatus(token);

        console.log(
          "ORIENTATION: orientation status",
          orientation
        );

        // ---------------------------------------------
        // 3. STORE DATA
        // ---------------------------------------------

        const studentData =
          profile?.row || profile;

        setStudent(studentData);
        setStatus(orientation);

        // ---------------------------------------------
        // 4. DETERMINE PAGE
        // ---------------------------------------------

        if (
          orientation?.status ===
          "Completed"
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

        /*
         * IMPORTANT:
         * Do NOT automatically delete the PPBMS token.
         *
         * This allows us to see the actual error
         * instead of silently redirecting the student
         * back to the login page.
         */

        setError(
          err?.message ||
          "Unable to load your orientation."
        );

      } finally {
        setLoading(false);
      }
    }

    loadOrientation();

  }, [token]);


  // =====================================================
  // LOGOUT
  // =====================================================

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


  // =====================================================
  // LOADING SCREEN
  // =====================================================

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


  // =====================================================
  // ERROR SCREEN
  // =====================================================

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


  // =====================================================
  // NO STUDENT PROFILE
  // =====================================================

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


  // =====================================================
  // COMPLETED
  // =====================================================

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


  // =====================================================
  // ORIENTATION
  // =====================================================

  if (page === "orientation") {
    return (
      <Orientation
        student={student}
        token={token}
        onCompleted={() =>
          setPage("completed")
        }
      />
    );
  }


  // =====================================================
  // WELCOME
  // =====================================================

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
