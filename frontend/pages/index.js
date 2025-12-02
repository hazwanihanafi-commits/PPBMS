// frontend/pages/index.js
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex flex-col">
      {/* Top bar */}
      <header className="w-full border-b bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            <div>
              <div className="font-bold text-lg text-gray-900">PPBMS</div>
              <div className="text-xs text-gray-500">
                Postgraduate Progress &amp; Benchmarking System
              </div>
            </div>
          </div>

          <Link
            href="/login"
            className="hidden md:inline-flex px-4 py-2 rounded-full text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            General Login
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16 grid lg:grid-cols-2 gap-10 items-center">
          {/* Left: Hero text */}
          <div className="space-y-5">
            <p className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
              IPPT · USM · Research Progress
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Monitor postgraduate{" "}
              <span className="text-purple-700">research progress</span>{" "}
              in one simple dashboard.
            </h1>

            <p className="text-gray-600 text-sm sm:text-base max-w-xl">
              Secure web platform for tracking MSc and PhD milestones,
              supervisor monitoring, and documentation — tailored for
              IPPT / USM research programmes.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/login?role=student"
                className="px-5 py-2.5 rounded-full bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition"
              >
                Login as Student
              </Link>
              <Link
                href="/login?role=supervisor"
                className="px-5 py-2.5 rounded-full bg-white border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 transition"
              >
                Login as Supervisor
              </Link>
              <Link
                href="/login?role=admin"
                className="px-5 py-2.5 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
              >
                Login as Admin
              </Link>
            </div>
          </div>

          {/* Right: Role cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Student card */}
            <RoleCard
              title="Student"
              description="View your expected vs actual timeline, upload documents, and track progress toward completion."
              href="/login?role=student"
              accent="from-purple-500 to-pink-500"
              initials="ST"
            />

            {/* Supervisor card */}
            <RoleCard
              title="Supervisor"
              description="Monitor all your supervisees, identify at-risk progress, and support timely completion."
              href="/login?role=supervisor"
              accent="from-indigo-500 to-purple-500"
              initials="SV"
            />

            {/* Admin card */}
            <RoleCard
              title="Admin"
              description="Configure programmes, monitor cohorts, and generate reports for quality assurance."
              href="/login?role=admin"
              accent="from-orange-500 to-rose-500"
              initials="AD"
            />

            {/* Info card */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 p-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800 text-sm">
                  Need help?
                </h3>
                <p className="text-xs text-gray-600">
                  For account issues or access requests, please contact
                  the Academic &amp; International Office, IPPT.
                </p>
              </div>
              <p className="mt-3 text-[11px] text-gray-400">
                © {new Date().getFullYear()} IPPT · Universiti Sains Malaysia
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* -------- Small reusable card component -------- */
function RoleCard({ title, description, href, accent, initials }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl bg-white/80 border border-gray-100 shadow-sm hover:shadow-md p-4 flex flex-col gap-3 transition transform hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white text-xs font-bold`}
        >
          {initials}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <p className="text-[11px] uppercase tracking-wide text-purple-500">
            Secure login
          </p>
        </div>
      </div>
      <p className="text-[12px] text-gray-600 flex-1">{description}</p>
      <span className="text-[11px] font-semibold text-purple-700 group-hover:text-purple-900">
        Go to {title.toLowerCase()} login →
      </span>
    </Link>
  );
}
