import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">

      {/* HEADER */}
      <header className="w-full py-5 backdrop-blur bg-white/70 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-10 flex justify-between items-center">

          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow">
              P
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight">PPBMS</h1>
              <p className="text-xs text-gray-500 -mt-1">
                Postgraduate Portfolio-Based Monitoring System
              </p>
            </div>
          </div>

          {/* LOGIN */}
          <Link
            href="/login"
            className="px-6 py-2 rounded-xl bg-purple-600 text-white font-medium shadow hover:bg-purple-700 transition"
          >
            Login
          </Link>
        </div>
      </header>

      {/* HERO */}
      <main className="w-full px-10 py-24">
        <div className="max-w-[1200px] mx-auto text-center">

          <h2 className="text-5xl xl:text-6xl font-extrabold leading-tight mb-6">
            Monitor Postgraduate
            <span className="block bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Research Progress
            </span>
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto mb-12 text-lg">
            A centralized platform for MSc & PhD monitoring, supervisor oversight,
            and CQI reporting.
          </p>

          {/* CTA */}
          <Link
            href="/login"
            className="inline-block px-8 py-3 rounded-xl bg-purple-600 text-white font-semibold shadow-lg hover:bg-purple-700 transition"
          >
            Get Started
          </Link>

          {/* CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <Card
              title="Student"
              desc="View timeline, upload documents, and track research milestones."
              href="/login"
            />

            <Card
              title="Supervisor"
              desc="Monitor supervisees and identify risks early."
              href="/login"
            />

            <Card
              title="Admin"
              desc="Programme CQI monitoring, cohort tracking, and reports."
              href="/admin/login"
            />
          </div>

          {/* SECONDARY SECTION */}
          <section className="mt-24 pt-12 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-sm text-gray-600">

              <Feature
                title="Structured Monitoring"
                desc="Track milestones, candidature status, and progress reviews in one place."
              />

              <Feature
                title="Supervisor Oversight"
                desc="Early identification of at-risk candidates with timely intervention."
              />

              <Feature
                title="CQI & Reporting"
                desc="Programme-level monitoring aligned with accreditation standards."
              />

            </div>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        © 2025 PPBMS · Universiti Sains Malaysia · Developed by HAY
      </footer>
    </div>
  );
}

/* CARD */
function Card({ title, desc, href }) {
  return (
    <div className="p-8 bg-white/80 backdrop-blur rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 mb-5 text-sm">{desc}</p>

      <Link
        href={href}
        className="text-purple-600 font-medium text-sm hover:underline"
      >
        Go to login →
      </Link>
    </div>
  );
}

/* FEATURE */
function Feature({ title, desc }) {
  return (
    <div>
      <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
      <p>{desc}</p>
    </div>
  );
}
