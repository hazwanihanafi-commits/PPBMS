
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../utils/api";

export default function SetPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Get email from URL after Next.js router is ready
  useEffect(() => {
    if (!router.isReady) return;

    const queryEmail = router.query.email;

    if (typeof queryEmail === "string") {
      setEmail(queryEmail.trim().toLowerCase());
    }
  }, [router.isReady, router.query.email]);

  async function submit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email) {
      setError(
        "Email not found. Please return to the login page."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/auth/set-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        setError(
          json.error || "Failed to set password."
        );
        return;
      }

      setSuccess(
        "Password set successfully. Redirecting to login..."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.replace("/login");
      }, 1500);

    } catch (err) {
      console.error("SET PASSWORD ERROR:", err);

      setError(
        "Unable to connect to the server. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-purple-50 to-white">

      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full">

        <h1 className="text-2xl font-bold text-purple-700 text-center mb-2">
          PPBMS
        </h1>

        <h2 className="text-xl font-semibold text-center mb-3">
          Set Password
        </h2>

        <p className="text-sm text-gray-500 text-center mb-6">
          Create a password for your PPBMS account.
        </p>

        <form onSubmit={submit}>

          <label className="block text-sm font-medium mb-1">
            Registered Email
          </label>

          <input
            type="email"
            className="w-full border p-3 rounded mb-4 bg-gray-100"
            value={email}
            disabled
          />

          <label className="block text-sm font-medium mb-1">
            New Password
          </label>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
            className="w-full border p-3 rounded mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />

          <label className="block text-sm font-medium mb-1">
            Confirm Password
          </label>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            className="w-full border p-3 rounded mb-3"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            autoComplete="new-password"
            required
            minLength={8}
          />

          <label className="flex items-center gap-2 text-sm mb-4">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) =>
                setShowPassword(e.target.checked)
              }
            />
            Show password
          </label>

          {error && (
            <p
              role="alert"
              className="text-red-600 text-sm mb-4"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="text-green-600 text-sm mb-4"
            >
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !!success}
            className="w-full bg-purple-600 text-white py-3 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>

        </form>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="block w-full text-center text-purple-600 text-sm underline mt-5"
        >
          ← Back to Login
        </button>

      </div>
    </div>
  );
}
