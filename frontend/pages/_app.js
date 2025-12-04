import "../styles/globals.css";
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <>
      <Head>
        <title>PPBMS — Student Progress</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6B21A8" />
        <meta name="color-scheme" content="light dark" />
      </Head>

      {getLayout(<Component {...pageProps} />)}
    </>
  );
}
