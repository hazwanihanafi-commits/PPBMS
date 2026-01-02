// frontend/pages/index.js
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">

      {/* HEADER */}
      <header className="w-full py-5 px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-orange-400 
            flex items-center justify-center text-white font-bold">
            P
          </div>
          <div>
            <h1 className="font-semibold text-lg">PPBMS</h1>
            <p className="text-xs text-gray-500 -mt-1">
              Postgraduate Portfolio-Based Monitoring System
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="px-6 py-2 rounded-full bg-purple-600 text-white font-medium hover:bg-purple-700"
        >
          

      {/* HERO */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-5xl font-extrabold mb-6">
          Monitor postgraduate <span className="text-purple-700">research progress</span>
        </h2>

        <p className="text-gray-600 max-w-3xl mb-10">
          Secure platform for MSc & PhD monitoring, supervisor oversight, and CQI reporting.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* STUDENT */}
          <Card
            title="Student"
            desc="View timeline, upload documents, track milestones."
            href="/login"
          />

          {/* SUPERVISOR */}
          <Card
            title="Supervisor"
            desc="Monitor supervisees and intervene early."
            href="/login"
          />

          {/* ADMIN */}
          <Card
            title="Admin"
            desc="Programme CQI, cohort monitoring, reports."
            href="/admin/login"
            highlight
          />

        </div>
      </main>

      <footer className="text-center py-6 text-gray-500 text-sm">
        © 2025 PPBMS · Universiti Sains Malaysia · Developed by HAY
      </footer>
    </div>
  );
}

function Card({ title, desc, href, highlight }) {
  return (
    <div className={`p-6 bg-white rounded-2xl shadow ${highlight ? "md:col-span-2" : ""}`}>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{desc}</p>
      <Link href={href} className="text-purple-600 font-medium hover:underline">
        Go to login →
      </Link>
    </div>
  );
}
