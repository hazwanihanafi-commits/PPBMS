import "../styles/globals.css";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>PPBMS — Student Progress</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Color theme for browsers */}
        <meta name="theme-color" content="#6B21A8" />
      </Head>

      {/* Global page wrapper */}
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <Component {...pageProps} />
      </div>
    </>
  );
}
