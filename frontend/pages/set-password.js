import { useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../utils/api";

export default function SetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState(router.query.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit() {
    setError("");
    setSuccess("");

    const res = await fetch(`${API_BASE}/auth/set-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Failed to set password");
      return;
    }

    setSuccess("Password set successfully. You may now login.");
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-purple-50 to-white">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full">
        <h1 className="text-xl font-bold mb-4">Set Password</h1>

        <input
          type="email"
          className="w-full border p-3 rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled
        />

        <input
          type="password"
          placeholder="Create password (min 8 characters)"
          className="w-full border p-3 rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          className="w-full bg-purple-600 text-white py-3 rounded font-semibold"
        >
          Set Password
        </button>

        {success && <p className="text-green-600 mt-4">{success}</p>}
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
}
