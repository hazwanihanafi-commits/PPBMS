import { useState } from "react";
import { useRouter } from "next/router";
import { API_BASE } from "../utils/api";

export default function RequestPassword() {
  const router = useRouter();
  const [email, setEmail] = useState(router.query.email || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setMessage("");
    setError("");

    const res = await fetch(`${API_BASE}/auth/request-set-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Email not recognised");
      return;
    }

    setMessage("Password setup link sent. Check your email.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl shadow max-w-md w-full">
        <h1 className="text-xl font-bold mb-4">Set Password</h1>

        <input
          type="email"
          placeholder="Institutional Email"
          className="w-full border p-3 rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={submit}
          className="w-full bg-purple-600 text-white py-3 rounded"
        >
          Send Setup Link
        </button>

        {message && <p className="text-green-600 mt-4">{message}</p>}
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
}
