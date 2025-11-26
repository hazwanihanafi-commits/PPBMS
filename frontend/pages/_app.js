import { useEffect } from "react";
import "../styles/dashboard.css";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Do not run on login page
    if (window.location.pathname === "/login") return;

    const token = localStorage.getItem("ppbms_token");

    // If no token, redirect to login
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
