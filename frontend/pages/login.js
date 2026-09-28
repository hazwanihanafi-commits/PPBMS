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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await res.json();

      /*
       * --------------------------------
       * RETURN PATH
       * --------------------------------
       */

      const returnTo =
        typeof router.query.returnTo === "string"
          ? router.query.returnTo
          : null;

      // Only allow internal PPBMS paths
      const safeReturnTo =
        returnTo &&
        returnTo.startsWith("/")
          ? returnTo
          : null;


      /*
       * --------------------------------
       * FIRST-TIME LOGIN
       * --------------------------------
       */

      if (data.requirePasswordSetup) {

        const passwordSetupUrl =
          `/set-password?email=${encodeURIComponent(
            data.email
          )}&returnTo=${encodeURIComponent(
            safeReturnTo || ""
          )}`;

        router.push(passwordSetupUrl);

        return;
      }


      /*
       * --------------------------------
       * LOGIN ERROR
       * --------------------------------
       */

      if (!res.ok) {

        setError(
          data.error ||
          "Login failed"
        );

        return;
      }


      /*
       * --------------------------------
       * STORE AUTH
       * --------------------------------
       */

      localStorage.setItem(
        "ppbms_token",
        data.token
      );

      localStorage.setItem(
        "ppbms_role",
        data.role
      );

      localStorage.setItem(
        "ppbms_email",
        data.email
      );


      /*
       * --------------------------------
       * REDIRECT
       * --------------------------------
       */

      // STUDENT
      if (data.role === "student") {

        router.replace(
          safeReturnTo || "/student"
        );

        return;
      }


      // SUPERVISOR
      if (data.role === "supervisor") {

        router.replace(
          "/supervisor"
        );

        return;
      }


      // ADMIN
      if (data.role === "admin") {

        router.replace(
          "/admin"
        );

        return;
      }


      // UNKNOWN ROLE
      setError(
        "Unknown role"
      );

    } catch (err) {

      console.error(
        "LOGIN ERROR:",
        err
      );

      setError(
        "Server error. Please try again."
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

      <div className="w-full max-w-sm">

        <form
          onSubmit={handleLogin}
          className="bg-white p-6 rounded-xl shadow space-y-4"
        >

          <h1 className="text-xl font-bold text-purple-700 text-center">
            PPBMS Login
          </h1>


          <input
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Email"
            type="email"
            required
          />


          <input
            className="w-full border p-2 rounded"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Password"
            required
          />


          {error && (
            <p className="text-red-600 text-sm text-center">
              {error}
            </p>
          )}


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>


        <p className="text-xs text-gray-500 text-center mt-4">
          First time login? Use your registered email.
          You will go to set password page.
        </p>


        <p className="text-xs text-purple-600 text-center mt-1">
          Forgot password? Contact admin.
        </p>


        <div className="mt-4 text-center">

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="text-sm text-purple-600 underline"
          >
            ← Back to Landing Page
          </button>

        </div>

      </div>

    </div>
  );
}
