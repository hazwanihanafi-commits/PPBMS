import { useEffect } from "react";

export default function Login() {

  useEffect(() => {

    window.top.location.href =
      "/login?returnTo=/orientation";

  }, []);

  return (
    <div className="loading-screen">

      <div className="loading-logo">
        PKTAAB
      </div>

      <div className="spinner"></div>

      <p>
        Redirecting to PPBMS Login...
      </p>

    </div>
  );
}
