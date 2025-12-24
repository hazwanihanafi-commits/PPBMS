// frontend/pages/login.js
import { useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../utils/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await res.json();

      // 🔐 First-time login → force password setup
      if (!res.ok) {
        if (data.error === "PASSWORD_NOT_SET") {
          router.push(`/request-password?email=${email}`);
          return;
        }

        setError(data.error || "Login failed");
        return;
      }

      // ✅ Save session
      localStorage.setItem("ppbms_token", data.token);
      localStorage.setItem("ppbms_role", data.role);
      localStorage.setItem("ppbms_email", email.toLowerCase().trim());

      // ✅ Redirect by role
      if (data.role === "supervisor") {
        router.push("/supervisor");
      } else {
        router.push("/student");
      }

    } catch (err) {
      console.error(err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full">

        <h1 className="text-2xl font-bold mb-2">PPBMS Login</h1>
        <p className="text-gray-600 mb-6">
          Student & Supervisor Access
        </p>

        <form onSubmit={handleLogin} className="space-y-4">

          <input
            type="email"
            placeholder="Institutional Email (e.g. name@usm.my)"
            className="w-full border p-3 rounded-xl focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded-xl focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="text-sm text-center mt-4">
          First time login?{" "}
          <a
            href="/request-password"
            className="text-purple-600 underline"
          >
            Set your password
          </a>
        </p>

      </div>
    </div>
  );
}
