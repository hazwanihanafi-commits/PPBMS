// pages/login.js
import { useState } from "react";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // not used, but needed for UI
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.token) {
        setError("Invalid login credentials");
        return;
      }

      // STORE LOGIN DATA
      localStorage.setItem("ppbms_token", data.token);
      localStorage.setItem("ppbms_user_email", data.email);
      localStorage.setItem("ppbms_role", data.role);

      // REDIRECT BY ROLE
      if (data.role === "supervisor") {
        router.push("/supervisor");
      } else {
        router.push("/student/me");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          className="w-full p-3 border rounded"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-3 border rounded"
          type="password"
          placeholder="Enter any password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-purple-600 text-white p-3 rounded">
          Login
        </button>
      </form>
    </div>
  );
}
