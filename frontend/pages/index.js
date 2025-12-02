// frontend/pages/index.js
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      
      {/* ---------------- HEADER ---------------- */}
      <header className="flex justify-between items-center px-10 py-6 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-orange-400 text-white text-xl font-bold shadow">
            P
          </div>
          <div>
            <div className="font-bold text-xl">PPBMS</div>
            <div className="text-sm text-gray-600">Postgraduate Progress & Benchmarking System</div>
          </div>
        </div>

        <Link
          href="/login"
          className="px-5 py-2.5 rounded-full bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
        >
          General Login
        </Link>
      </header>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="px-10 py-16 grid grid-cols-12 gap-12">
        
        {/* LEFT TEXT PANEL */}
        <div className="col-span-6">
          <div className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full w-max mb-6">
            IPPT · USM · Research Progress
          </div>

          <h1 className="text-5xl font-extrabold leading-tight">
            Monitor postgraduate <br />
            <span className="text-purple-700">research progress</span> in <br />
            one simple dashboard.
          </h1>

          <p className="text-lg text-gray-700 mt-6 leading-relaxed">
            Secure web platform for tracking MSc and PhD milestones, supervisor
            monitoring, and documentation — tailored for IPPT / USM research programmes.
          </p>

          {/* MAIN LOGIN BUTTONS */}
          <div className="flex gap-4 mt-10">
            <a
              href="/login?role=student"
              className="px-6 py-3 bg-purple-600 text-white rounded-full shadow hover:bg-purple-700 transition"
            >
              Login as Student
            </a>

            <a
              href="/login?role=supervisor"
              className="px-6 py-3 bg-white border border-purple-300 text-purple-700 rounded-full shadow hover:bg-gray-50 transition"
            >
              Login as Supervisor
            </a>

            <a
              href="/login?role=admin"
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-full shadow hover:bg-gray-50 transition"
            >
              Login as Admin
            </a>
          </div>
        </div>

        {/* RIGHT LOGIN BOXES */}
        <div className="col-span-6 space-y-6">
          
          {/* Student Card */}
          <div className="p-6 border rounded-2xl shadow-sm hover:shadow-md transition bg-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-200 text-purple-700 flex items-center justify-center font-bold">
                ST
              </div>
              <div>
                <div className="font-semibold text-lg">Student</div>
                <div className="text-xs text-purple-700 font-medium">SECURE LOGIN</div>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              View your expected vs actual timeline, upload documents,
              and track progress toward completion.
            </p>

            <a
              href="/login?role=student"
              className="text-purple-700 text-sm font-medium mt-4 inline-block hover:underline"
            >
              Go to student login →
            </a>
          </div>

          {/* Supervisor Card */}
          <div className="p-6 border rounded-2xl shadow-sm hover:shadow-md transition bg-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-200 text-purple-700 flex items-center justify-center font-bold">
                SV
              </div>
              <div>
                <div className="font-semibold text-lg">Supervisor</div>
                <div className="text-xs text-purple-700 font-medium">SECURE LOGIN</div>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              Monitor all your supervisees, identify at-risk progress, and support timely completion.
            </p>

            <a
              href="/login?role=supervisor"
              className="text-purple-700 text-sm font-medium mt-4 inline-block hover:underline"
            >
              Go to supervisor login →
            </a>
          </div>

          {/* Admin Card */}
          <div className="p-6 border rounded-2xl shadow-sm hover:shadow-md transition bg-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-200 text-orange-700 flex items-center justify-center font-bold">
                AD
              </div>
              <div>
                <div className="font-semibold text-lg">Admin</div>
                <div className="text-xs text-purple-700 font-medium">SECURE LOGIN</div>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              Configure programmes, monitor cohorts, and generate reports for quality assurance.
            </p>

            <a
              href="/login?role=admin"
              className="text-purple-700 text-sm font-medium mt-4 inline-block hover:underline"
            >
              Go to admin login →
            </a>
          </div>

          {/* Help Card */}
          <div className="p-6 border rounded-2xl shadow-sm bg-white">
            <div className="font-semibold mb-1">Need help?</div>
            <p className="text-sm text-gray-600">
              For account issues or access requests, please contact the Academic & International Office, IPPT.
            </p>

            <p className="text-xs text-gray-500 mt-4">
              © 2025 IPPT · Universiti Sains Malaysia
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
