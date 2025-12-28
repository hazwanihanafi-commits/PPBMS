import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../utils/api";

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

    if (role === "supervisor") {
      router.replace("/supervisor");
    } else if (role === "student") {
      router.replace("/student");
    } else if (role === "admin") {
      router.replace("/admin");
    }
  }, [router.isReady]);

  /* =====================================
     LOGIN HANDLER
  ===================================== */

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      }
    );

    const data = await res.json();

    /* ❌ login failed */
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
    if (data.role === "admin") {
      router.push("/admin");
    } else if (data.role === "supervisor") {
      router.push("/supervisor");
    } else {
      router.push("/student");
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        required
      />

      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
      />

      {error && <p className="text-red-600">{error}</p>}

      <button type="submit">Login</button>
    </form>
  );
}
