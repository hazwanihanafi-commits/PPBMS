import { useState } from "react";
import { API_BASE } from "../../utils/api";
import { useRouter } from "next/router";

export default function StudentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login(e) {
    e.preventDefault();
    setError("");

    const res = await fetch(`${API_BASE}/auth/login`, {   // ← FIXED HERE
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const json = await res.json();
    if (!res.ok) return setError(json.error || "Login failed");

    localStorage.setItem("ppbms_token", json.token);
    router.push("/student");   // redirect to student dashboard
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Student Login</h1>

      <form onSubmit={login} className="space-y-4">
        <input
          type="email"
          placeholder="USM Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-purple-600 text-white py-2 rounded">
          Login
        </button>
      </form>

      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
}
