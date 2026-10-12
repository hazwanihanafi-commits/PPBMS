
import { useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../utils/api";

export default function ResetPassword() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!router.isReady) return;

    const { token, email } = router.query;

    if (
      typeof token !== "string" ||
      typeof email !== "string"
    ) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    if (password.length < 12 || password.length > 128) {
      setError("Password must contain 12–128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            token,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Unable to reset password."
        );
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");

    } catch (err) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full">

        <h1 className="text-2xl font-bold text-purple-700 text-center mb-2">
          PPBMS
        </h1>

        <h2 className="text-xl font-semibold text-center mb-4">
          Reset Password
        </h2>

        {success ? (
          <div className="text-center">
            <p className="text-green-700 mb-5">
              Your password has been reset successfully.
            </p>

            <button
              onClick={() => router.replace("/login")}
              className="w-full bg-purple-600 text-white py-3 rounded"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            <p className="text-sm text-gray-500 text-center mb-5">
              Enter a new password for your PPBMS account.
            </p>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password (12–128 characters)"
              className="w-full border p-3 rounded mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={12}
              maxLength={128}
              required
            />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              className="w-full border p-3 rounded mb-3"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={12}
              maxLength={128}
              required
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
              <p role="alert" className="text-red-600 text-sm mb-4">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !router.isReady}
              className="w-full bg-purple-600 text-white py-3 rounded font-semibold disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="block w-full text-center text-purple-600 text-sm underline mt-5"
            >
              Request New Reset Link
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
