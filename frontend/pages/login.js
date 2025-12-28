import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault(); // ✅ CRITICAL

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
        throw new Error(data.error || "Login failed");
      }

      /* =========================
         SAVE AUTH (SINGLE SOURCE)
      ========================= */
      localStorage.setItem("ppbms_token", data.token);
      localStorage.setItem("ppbms_role", data.role);
      localStorage.setItem("ppbms_email", data.email);

      /* =========================
         ROLE REDIRECT (ONCE)
      ========================= */
      if (data.role === "student") router.push("/student");
      else if (data.role === "supervisor") router.push("/supervisor");
      else if (data.role === "admin") router.push("/admin");
      else throw new Error("Unknown role");

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow w-96 space-y-4"
      >
        <h1 className="text-xl font-bold text-purple-700">
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

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
