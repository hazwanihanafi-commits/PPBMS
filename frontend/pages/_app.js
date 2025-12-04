import "../styles/globals.css";
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>PPBMS — Student Progress & Milestones</title>

        {/* Modern viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Theme color for browsers */}
        <meta name="theme-color" content="#6B21A8" />

        {/* Safari compatibility */}
        <meta name="color-scheme" content="light" />
      </Head>

      {/* Global background */}
      <main className="min-h-screen bg-gradient-to-b from-[#faf7ff] to-[#ffffff]">
        <Component {...pageProps} />
      </main>
    </>
  );
}
