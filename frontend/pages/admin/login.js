// frontend/pages/admin/login.js
import { useState } from "react";
import { API_BASE } from "../../utils/api";
import { useRouter } from "next/router";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login(e) {
    e.preventDefault();
    setError("");

    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) return setError(json.error || "Login failed");

    localStorage.setItem("ppbms_token", json.token);
    router.push("/admin"); // redirect to admin dashboard
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-6">

      <div className="bg-white shadow-card rounded-2xl p-8 max-w-md w-full border border-gray-100">

        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Admin Login</h1>
        <p className="text-gray-600 mb-6">System administrator access</p>

        <form onSubmit={login} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            className="w-full border p-3 rounded-xl focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded-xl focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl shadow hover:bg-purple-700 transition"
          >
            Login
          </button>
        </form>

        {error && <p className="text-red-600 mt-3">{error}</p>}
      </div>

    </div>
  );
}
