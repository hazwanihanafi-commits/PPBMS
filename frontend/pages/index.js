import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">

      {/* HEADER */}
      <header className="w-full py-5">
        <div className="max-w-[1600px] mx-auto px-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-orange-400 flex items-center justify-center text-white font-bold">
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
            Login
          </Link>
        </div>
      </header>

      {/* HERO */}
      <main className="w-full px-12 py-24 min-h-[75vh]">
        <div className="max-w-[1600px] mx-auto">

          <h2 className="text-6xl xl:text-7xl font-extrabold mb-8">
            Monitor postgraduate{" "}
            <span className="text-purple-700">research progress</span>
          </h2>

          <p className="text-gray-600 max-w-3xl mb-14 text-lg">
            Secure platform for MSc & PhD monitoring, supervisor oversight, and CQI reporting.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <Card
              title="Student"
              desc="View timeline, upload documents, track milestones."
              href="/login"
            />

            <Card
              title="Supervisor"
              desc="Monitor supervisees and intervene early."
              href="/login"
            />

            <Card
              title="Admin"
              desc="Programme CQI, cohort monitoring, reports."
              href="/admin/login"
            />
          </div>

          {/* SECONDARY SECTION */}
          <section className="mt-24 border-t border-gray-200 pt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-sm text-gray-600">

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Structured Monitoring
                </h4>
                <p>
                  Track milestones, candidature status, and progress reviews in one place.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Supervisor Oversight
                </h4>
                <p>
                  Early identification of at-risk candidates and timely intervention.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  CQI & Reporting
                </h4>
                <p>
                  Programme-level monitoring aligned with accreditation and quality assurance.
                </p>
              </div>

            </div>
          </section>

        </div>
      </main>

      <footer className="text-center py-6 text-gray-500 text-sm">
        © 2025 PPBMS · Universiti Sains Malaysia · Developed by HAY
      </footer>
    </div>
  );
}

function Card({ title, desc, href }) {
  return (
    <div className="p-10 bg-white rounded-2xl shadow-md hover:shadow-lg transition">
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{desc}</p>
      <Link href={href} className="text-purple-600 font-medium hover:underline">
        Go to login →
      </Link>
    </div>
  );
}
