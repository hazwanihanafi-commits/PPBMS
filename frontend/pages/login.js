import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* =====================================
     AUTO REDIRECT IF ALREADY LOGGED IN
  ===================================== */
  useEffect(() => {
    if (!router.isReady) return;

    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");

    if (!token || !role) return;

    if (role === "admin") router.replace("/admin");
    else if (role === "supervisor") router.replace("/supervisor");
    else router.replace("/student");
  }, [router.isReady]);

  /* =====================================
     LOGIN HANDLER
  ===================================== */
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
          body: JSON.stringify({ email, password })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      /* 🔑 FIRST LOGIN → SET PASSWORD */
      if (data.requirePasswordSetup) {
        localStorage.setItem("ppbms_email", data.email);
        localStorage.setItem("ppbms_role", data.role);
        router.push("/set-password");
        return;
      }

      /* ✅ NORMAL LOGIN */
      localStorage.setItem("ppbms_token", data.token);
      localStorage.setItem("ppbms_role", data.role);
      localStorage.setItem("ppbms_email", data.email);

      /* 🔀 ROLE-BASED REDIRECT */
      if (data.role === "admin") router.push("/admin");
      else if (data.role === "supervisor") router.push("/supervisor");
      else router.push("/student");

    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow w-96 space-y-4"
      >
        <h1 className="text-xl font-bold text-purple-700">PPBMS Login</h1>

        <input
          className="w-full border p-2 rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
        />

        <input
          className="w-full border p-2 rounded"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
