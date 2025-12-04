// frontend/pages/_app.js
import "../styles/globals.css";
import Head from "next/head";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>PPBMS — Student Progress</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      <Header />

      <main className="min-h-[calc(100vh-160px)]">
        <Component {...pageProps} />
      </main>

      <Footer />
    </>
  );
}

export default MyApp;
