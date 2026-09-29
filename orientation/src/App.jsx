import React, {
  useEffect,
  useState
} from "react";

import Welcome from "./pages/Welcome";
import Orientation from "./pages/Orientation";
import Completed from "./pages/Completed";

import {
  getStudentProfile,
  getOrientationStatus
} from "./api";


// =====================================================
// ERROR BOUNDARY
// =====================================================

class OrientationErrorBoundary extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {

    console.error(
      "ORIENTATION RENDER ERROR:",
      error
    );

    console.error(
      "ORIENTATION ERROR INFO:",
      errorInfo
    );
  }

  render() {

    if (this.state.hasError) {

      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#f8f7fb",
            padding: "40px 20px",
            fontFamily: "Arial, sans-serif",
            color: "#222"
          }}
        >

          <div
            style={{
              maxWidth: "700px",
              margin: "0 auto",
              background: "white",
              borderRadius: "16px",
              padding: "30px",
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.08)"
            }}
          >

            <div
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "#53257f",
                marginBottom: "10px"
              }}
            >
              PKTAAB
            </div>

            <h2>
              Orientation encountered an error
            </h2>

            <p>
              The Orientation system loaded, but
              something went wrong while displaying
              the page.
            </p>

            <div
              style={{
                background: "#fff3f3",
                border:
                  "1px solid #f0b5b5",
                borderRadius: "10px",
                padding: "15px",
                marginTop: "20px",
                overflowX: "auto"
              }}
            >

              <strong>
                Error:
              </strong>

              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  marginTop: "10px"
                }}
              >
                {this.state.error?.message ||
                  String(this.state.error)}
              </pre>

            </div>

            <button
              onClick={() =>
                window.location.reload()
              }
              style={{
                marginTop: "20px",
                padding: "12px 20px",
                border: "none",
                borderRadius: "8px",
                background: "#53257f",
                color: "white",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              TRY AGAIN
            </button>

          </div>

        </div>
      );
    }

    return this.props.children;
  }
}


// =====================================================
// MAIN APP
// =====================================================

function OrientationApp() {

  const [token, setToken] =
    useState(() =>
      localStorage.getItem(
        "ppbms_token"
      )
    );

  const [student, setStudent] =
    useState(null);

  const [status, setStatus] =
    useState(null);

  const [page, setPage] =
    useState("welcome");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {

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
          "ORIENTATION: token found"
        );


        // ---------------------------------------------
        // STUDENT
        // ---------------------------------------------

        const profile =
          await getStudentProfile(
            token
          );

        console.log(
          "ORIENTATION PROFILE:",
          profile
        );


        // ---------------------------------------------
        // ORIENTATION
        // ---------------------------------------------

        const orientation =
          await getOrientationStatus(
            token
          );

        console.log(
          "ORIENTATION STATUS:",
          orientation
        );


        // ---------------------------------------------
        // NORMALISE
        // ---------------------------------------------

        const studentData =
          profile?.row ||
          profile?.student ||
          profile;


        const orientationData =
          orientation?.row ||
          orientation;


        console.log(
          "NORMALISED STUDENT:",
          studentData
        );

        console.log(
          "NORMALISED ORIENTATION:",
          orientationData
        );


        if (!studentData) {

          throw new Error(
            "Student profile returned empty data."
          );

        }


        setStudent(
          studentData
        );

        setStatus(
          orientationData
        );


        // ---------------------------------------------
        // PAGE
        // ---------------------------------------------

        if (
          String(
            orientationData?.status ||
            ""
          ).toLowerCase() ===
          "completed"
        ) {

          setPage(
            "completed"
          );

        } else {

          setPage(
            "welcome"
          );

        }

      } catch (err) {

        console.error(
          "ORIENTATION LOAD ERROR:",
          err
        );

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
  // LOADING
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
  // API ERROR
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
  // NO STUDENT
  // =====================================================

  if (!student) {

    return (
      <div className="loading-screen">

        <div className="loading-logo">
          PKTAAB
        </div>

        <p>
          Student profile not found.
        </p>

      </div>
    );

  }


  // =====================================================
  // COMPLETED
  // =====================================================

  if (
    page === "completed"
  ) {

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

  if (
    page === "orientation"
  ) {

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


// =====================================================
// EXPORT WITH ERROR BOUNDARY
// =====================================================

export default function App() {

  return (
    <OrientationErrorBoundary>
      <OrientationApp />
    </OrientationErrorBoundary>
  );

}
