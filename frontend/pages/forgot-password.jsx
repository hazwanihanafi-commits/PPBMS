
import { useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../utils/api";

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setSuccess(true);
    } catch (err) {
      setError(
        "Unable to process your request. Please try again later."
      );
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

        <h2 className="text-xl font-semibold text-center mb-3">
          Forgot Password
        </h2>

        {success ? (
          <div>
            <p className="text-green-700 text-sm text-center mb-5">
              If this email is registered with PPBMS,
              a password reset link will be sent to your email.
              Please check your inbox and spam folder.
            </p>

            <button
              onClick={() => router.push("/login")}
              className="w-full bg-purple-600 text-white py-3 rounded"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            <p className="text-sm text-gray-500 text-center mb-5">
              Enter your registered PPBMS email address
              to request a password reset link.
            </p>

            <input
              type="email"
              placeholder="Registered email"
              className="w-full border p-3 rounded mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <p className="text-red-600 text-sm mb-4">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded font-semibold disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="block w-full text-center text-purple-600 text-sm underline mt-5"
            >
              ← Back to Login
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
