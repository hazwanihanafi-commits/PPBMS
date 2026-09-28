import { useEffect, useState } from "react";

import Welcome from "./pages/Welcome";
import Orientation from "./pages/Orientation";
import Completed from "./pages/Completed";

import {
  getStudentProfile,
  getOrientationStatus
} from "./api";


export default function App() {

  const [token, setToken] =
    useState(
      localStorage.getItem("ppbms_token")
    );

  const [student, setStudent] =
    useState(null);

  const [status, setStatus] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [page, setPage] =
    useState("welcome");


  useEffect(() => {

    if (!token) {

      window.top.location.href =
        "/login?returnTo=/orientation";

      return;
    }


    async function loadStudent() {

      try {

        setLoading(true);
        setError("");

        console.log(
          "ORIENTATION: loading student profile..."
        );

        const profile =
          await getStudentProfile(token);

        console.log(
          "ORIENTATION: profile received",
          profile
        );


        console.log(
          "ORIENTATION: loading orientation status..."
        );

        const orientation =
          await getOrientationStatus(token);

        console.log(
          "ORIENTATION: status received",
          orientation
        );


        setStudent(
          profile?.row || profile
        );

        setStatus(
          orientation
        );


        if (
          orientation?.status ===
          "Completed"
        ) {

          setPage("completed");

        } else {

          setPage("welcome");

        }

      } catch (error) {

        console.error(
          "ORIENTATION ERROR:",
          error
        );

        setError(
          error.message ||
          "Unable to load your orientation."
        );

      } finally {

        setLoading(false);

      }

    }


    loadStudent();

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

        <p
          style={{
            maxWidth: "600px",
            textAlign: "center",
            color: "#b91c1c",
            marginTop: "15px"
          }}
        >
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
