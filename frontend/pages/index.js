import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-160px)] bg-gradient-to-b from-usm-50 to-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-usm-700 mb-4">PPBMS — Student Progress & Milestones</h1>
          <p className="text-lg text-gray-600 mb-8">Track students, timelines and submissions — tailored for USM researchers and supervisors.</p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/supervisor"><a className="px-6 py-3 rounded-xl bg-usm-700 text-white font-semibold">Supervisor Dashboard</a></Link>
            <Link href="/student"><a className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700">Student Dashboard</a></Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
