import "../styles/globals.css";
import Head from "next/head";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";

function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>PPBMS — Student Progress</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6B21A8" />
      </Head>

      <Header />

      <main className="min-h-[calc(100vh-160px)] bg-gray-50">
        <Component {...pageProps} />
      </main>

      <Footer />
    </>
  );
}

export default App;
