// frontend/pages/index.js
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f1ff] to-white">
      
      {/* TOP NAV */}
      <header className="w-full py-6 px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-orange-400 flex items-center justify-center text-white font-bold shadow">
            P
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-900">PPBMS</h1>
            <p className="text-sm text-gray-500 -mt-1">
              Postgraduate Progress & Benchmarking System
            </p>
          </div>
        </div>

        <a
          href="/login"
          className="px-6 py-2 rounded-xl bg-purple-600 text-white font-semibold shadow hover:bg-purple-700"
        >
          General Login
        </a>
      </header>

      {/* HERO SECTION */}
      <section className="px-8 mt-10 max-w-6xl mx-auto">
        <span className="inline-block px-4 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
          IPPT · USM · Research Progress
        </span>

        <h2 className="mt-6 text-5xl font-extrabold leading-[1.15] text-gray-900">
          Monitor postgraduate <br />
          <span className="text-purple-600">research progress</span> in <br />
          one simple dashboard.
        </h2>

        <p className="mt-6 text-gray-600 text-lg max-w-2xl">
          Secure web platform for tracking MSc and PhD milestones, supervisor monitoring,
          and documentation — tailored for IPPT / USM research programmes.
        </p>

        {/* LOGIN BUTTONS */}
        <div className="flex flex-wrap gap-4 mt-8">
          <a href="/student/login" className="btn bg-purple-600 text-white rounded-xl px-6 py-3 font-semibold shadow">
            Login as Student
          </a>
          <a href="/supervisor/login" className="btn bg-purple-100 text-purple-700 rounded-xl px-6 py-3 font-semibold">
            Login as Supervisor
          </a>
          <a href="/admin/login" className="btn bg-gray-200 text-gray-700 rounded-xl px-6 py-3 font-semibold">
            Login as Admin
          </a>
        </div>
      </section>

      {/* ROLE CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8 mt-14 max-w-6xl mx-auto">
        
        {/* STUDENT */}
        <div className="card p-6 rounded-2xl shadow bg-white border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold">
              ST
            </div>
            <div>
              <h3 className="font-bold text-lg">Student</h3>
              <span className="text-purple-600 text-xs font-semibold">SECURE LOGIN</span>
            </div>
          </div>

          <p className="text-gray-600 text-sm">
            View your expected vs actual timeline, upload documents, and track progress
            toward completion.
          </p>

          <a href="/student/login" className="block mt-4 text-purple-600 font-medium hover:underline">
            Go to student login →
          </a>
        </div>

        {/* SUPERVISOR */}
        <div className="card p-6 rounded-2xl shadow bg-white border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-400 text-white flex items-center justify-center font-bold">
              SV
            </div>
            <div>
              <h3 className="font-bold text-lg">Supervisor</h3>
              <span className="text-purple-600 text-xs font-semibold">SECURE LOGIN</span>
            </div>
          </div>

          <p className="text-gray-600 text-sm">
            Monitor all your supervisees, identify at-risk progress, and support timely completion.
          </p>

          <a href="/supervisor/login" className="block mt-4 text-purple-600 font-medium hover:underline">
            Go to supervisor login →
          </a>
        </div>

        {/* ADMIN */}
        <div className="card p-6 rounded-2xl shadow bg-white border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-400 text-white flex items-center justify-center font-bold">
              AD
            </div>
            <div>
              <h3 className="font-bold text-lg">Admin</h3>
              <span className="text-purple-600 text-xs font-semibold">SECURE LOGIN</span>
            </div>
          </div>

          <p className="text-gray-600 text-sm">
            Configure programmes, monitor cohorts, and generate reports for quality assurance.
          </p>

          <a href="/admin/login" className="block mt-4 text-purple-600 font-medium hover:underline">
            Go to admin login →
          </a>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="text-center text-gray-500 text-sm py-12 mt-16">
        © 2025 PPBMS · Universiti Sains Malaysia · Built with ❤
      </footer>
    </div>
  );
}
