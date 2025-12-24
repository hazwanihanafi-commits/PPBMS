import { useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../utils/api";

export default function RequestPassword() {
  const router = useRouter();
  const [email, setEmail] = useState(router.query.email || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setMessage("");

    const res = await fetch(`${API_BASE}/auth/set-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed");
      return;
    }

    setMessage("Password set successfully. You may login.");
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full">
        <h1 className="text-xl font-bold mb-4">Set Password</h1>

        <input
          type="email"
          className="w-full border p-3 rounded mb-3 bg-gray-100"
          value={email}
          disabled
        />

        <input
          type="password"
          placeholder="New Password (min 8 chars)"
          className="w-full border p-3 rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          className="w-full bg-purple-600 text-white py-3 rounded"
        >
          Set Password
        </button>

        {message && <p className="text-green-600 mt-4">{message}</p>}
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
}
