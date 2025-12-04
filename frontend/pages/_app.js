import "../styles/globals.css";
import Head from "next/head";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>PPBMS — Student Progress & Milestones</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6B21A8" />
      </Head>

      {/* Page wrapper */}
      <div className="min-h-screen bg-gradient-to-b from-[#faf7ff] to-white">
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default MyApp;
