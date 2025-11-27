// pages/_app.js
import "@/styles/globals.css";
import "@/styles/dashboard.css";

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
