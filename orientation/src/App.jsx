import { useEffect, useState } from "react";

import Login from "./pages/Login";
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
      localStorage.getItem("orientation_token")
    );

  const [student, setStudent] =
    useState(null);

  const [status, setStatus] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [page, setPage] =
    useState("welcome");


  useEffect(() => {

    if (!token) {
      setLoading(false);
      return;
    }

    async function loadStudent() {

      try {

        const profile =
          await getStudentProfile(token);

        const orientation =
          await getOrientationStatus(token);

        setStudent(profile);
        setStatus(orientation);

        if (
          orientation.status ===
          "Completed"
        ) {
          setPage("completed");
        }

      } catch (error) {

        console.error(error);

        localStorage.removeItem(
          "orientation_token"
        );

        setToken(null);

      } finally {

        setLoading(false);

      }
    }

    loadStudent();

  }, [token]);


  function handleLogin(data) {

    localStorage.setItem(
      "orientation_token",
      data.token
    );

    localStorage.setItem(
      "orientation_email",
      data.email
    );

    setToken(data.token);
  }


  function logout() {

    localStorage.removeItem(
      "orientation_token"
    );

    localStorage.removeItem(
      "orientation_email"
    );

    setToken(null);
    setStudent(null);
    setStatus(null);

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
      <Login
        onLogin={handleLogin}
      />
    );
  }


  if (!student) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading student profile...</p>
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
