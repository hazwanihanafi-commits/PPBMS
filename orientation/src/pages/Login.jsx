import { useState } from "react";

import { login } from "../api";


export default function Login({
  onLogin
}) {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  async function handleSubmit(e) {

    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      const data =
        await login(
          email,
          password
        );

      if (data.role !== "student") {

        throw new Error(
          "This orientation is for postgraduate students."
        );

      }

      onLogin(data);

    } catch (err) {

      setError(
        err.message ||
        "Unable to sign in."
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <div className="login-page">

      <div className="login-card">

        <div className="brand-mark">
          PKTAAB
        </div>

        <div className="login-kicker">
          POSTGRADUATE STUDENT ORIENTATION
        </div>

        <h1>
          Welcome to
          <br />
          <span>PKTAAB</span>
        </h1>

        <p className="login-description">
          Your orientation journey starts here.
        </p>


        <div className="login-note">

          <strong>
            🔐 Use your PPBMS account
          </strong>

          <span>
            No new account is required.
            Sign in using your existing
            USM student email and PPBMS
            password.
          </span>

        </div>


        <form onSubmit={handleSubmit}>

          <label>
            USM Student Email
          </label>

          <input
            type="email"
            placeholder="yourname@student.usm.my"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />


          <label>
            PPBMS Password
          </label>

          <input
            type="password"
            placeholder="Enter your PPBMS password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />


          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          <button
            className="primary-button"
            disabled={loading}
          >

            {loading
              ? "SIGNING IN..."
              : "SIGN IN →"}

          </button>

        </form>


        <p className="login-footer">
          Pusat Kanser Tun Abdullah Ahmad Badawi
          <br />
          Universiti Sains Malaysia
        </p>

      </div>

    </div>
  );
}
