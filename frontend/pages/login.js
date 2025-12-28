import { useState } from "react";
import { useRouter } from "next/router";

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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // ✅ STORE AUTH (SINGLE SOURCE OF TRUTH)
      localStorage.setItem("ppbms_token", data.token);
      localStorage.setItem("ppbms_role", data.role);
      localStorage.setItem("ppbms_email", data.email);

      // ✅ ROLE-BASED REDIRECT
      if (data.role === "student") {
        router.replace("/student");
      } else if (data.role === "supervisor") {
        router.replace("/supervisor");
      } else if (data.role === "admin") {
        router.replace("/admin");
      } else {
        setError("Unknown role");
      }

    } catch (err) {
      setError("Server error");
    }

    setLoading(false);
  }

  return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <form
      onSubmit={handleLogin}
      className="bg-white p-6 rounded-2xl shadow w-full max-w-sm space-y-4"
    >
      <h1 className="text-xl font-bold text-purple-700 text-center">
        PPBMS Login
      </h1>

      <input
        className="w-full border p-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />

      <input
        className="w-full border p-2 rounded"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {/* 👇 MOVED INSIDE CARD */}
      <div className="text-xs text-center text-gray-500 space-y-1 pt-2">
        <p>First time login? Use your registered email.</p>
        <p className="text-purple-600 cursor-pointer">
          Forgot password? Contact admin.
        </p>
      </div>
    </form>
  </div>
);
