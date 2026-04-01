import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#dfe9f3] via-[#f5f7fa] to-[#e0c3fc] flex items-center justify-center p-4 relative">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-200 via-transparent to-indigo-200 opacity-30 blur-3xl"></div>

      {/* GLASS CONTAINER */}
      <div className="w-full max-w-[1200px] rounded-3xl bg-white/40 backdrop-blur-xl shadow-2xl border border-white/30 overflow-hidden relative z-10">

        {/* HEADER */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-white/30 bg-white/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold">
              P
            </div>
            <div>
              <h1 className="font-semibold">PPBMS</h1>
              <p className="text-xs text-gray-600">
                Postgraduate Portfolio-Based Monitoring System
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="px-5 py-2 rounded-full bg-purple-600 text-white text-sm hover:bg-purple-700 transition"
          >
            Login
          </Link>
        </header>

        {/* HERO */}
        <div className="text-center px-6 py-16">

          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Monitor Postgraduate{" "}
            <span className="text-purple-600">Research Progress</span>
          </h2>

          <p className="text-gray-600 max-w-xl mx-auto mb-8">
            A centralized platform for MSc & PhD monitoring, supervisor oversight, and CQI reporting.
          </p>

          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-medium shadow-md hover:opacity-90 transition"
          >
            Get Started
          </Link>

        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-16">

          <GlassCard
            title="Student"
            desc="View timeline, upload documents, and track research milestones."
            href="/login"
          />

          <GlassCard
            title="Supervisor"
            desc="Monitor supervisees and identify risks early."
            href="/supervisor"
          />

          <GlassCard
            title="Admin"
            desc="Programme CQI monitoring, cohort tracking, and reports."
            href="/admin/login"
          />

        </div>

        {/* FOOTER */}
        <footer className="text-center text-xs text-gray-500 pb-6">
          © 2025 PPBMS · Universiti Sains Malaysia · Developed by HAY
        </footer>

      </div>
    </div>
  );
}

/* GLASS CARD */
function GlassCard({ title, desc, href }) {
  return (
    <div className="p-6 rounded-2xl bg-white/30 backdrop-blur-lg border border-white/40 shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-300">

      <h3 className="font-semibold mb-2">{title}</h3>

      <p className="text-gray-700 text-sm mb-4">
        {desc}
      </p>

      <Link
        href={href}
        className="text-purple-600 text-sm font-medium hover:underline"
      >
        Go to login →
      </Link>
     </div>
  </>
);
}
