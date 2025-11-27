// pages/_app.js
import "../styles/dashboard.css"; // custom styles (below)
import "../styles/globals.css";   // your existing tailwind/globals

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
