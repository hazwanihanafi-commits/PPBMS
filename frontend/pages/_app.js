
import "../styles/globals.css";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    // Public pages: no login required
    const publicPages = [
      "/",
      "/login",
      "/forgot-password",
      "/reset-password",
      "/set-password",
      "/admin/login",
    ];

    // Allow public pages and admin root
    if (
      publicPages.includes(router.pathname) ||
      router.pathname === "/admin"
    ) {
      return;
    }

    const token = localStorage.getItem("ppbms_token");
    const role = localStorage.getItem("ppbms_role");

    // No token: redirect to login
    if (!token) {
      router.replace(
        router.pathname.startsWith("/admin")
          ? "/admin/login"
          : "/login"
      );
      return;
    }

    // Wrong role: redirect to admin login
    if (
      router.pathname.startsWith("/admin") &&
      role !== "admin"
    ) {
      router.replace("/admin/login");
    }
  }, [router.isReady, router.pathname]);

  return (
    <>
      <Head>
        <title>PPBMS</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
