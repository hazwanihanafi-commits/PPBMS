export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">

      {/* HEADER */}
      <header className="w-full py-5 px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-orange-400 
            flex items-center justify-center text-white text-lg font-bold">
            P
          </div>
          <div>
            <h1 className="font-semibold text-lg text-gray-900">PPBMS</h1>
            <p className="text-xs text-gray-500 -mt-1">
              Postgraduate Progress & Benchmarking System
            </p>
          </div>
        </div>

        {/* ⭐ Only ONE login button */}
        <a
          href="/login"
          className="px-6 py-2 rounded-full bg-purple-600 text-white font-medium 
          hover:bg-purple-700 transition"
        >
          General Login
        </a>
      </header>

      {/* HERO SECTION */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-sm text-purple-700 bg-purple-100 inline-block px-4 py-1 
          rounded-full font-medium mb-5">
          IPPT · USM · Research Progress
        </div>

        <h2 className="text-5xl font-extrabold leading-tight text-gray-900 mb-6">
          Monitor postgraduate <span className="text-purple-700">research progress</span><br />
          in one simple dashboard.
        </h2>

        <p className="text-gray-600 text-lg max-w-3xl mb-10">
          Secure web platform for tracking MSc and PhD milestones, supervisor monitoring, 
          and documentation — tailored for IPPT / USM research programmes.
        </p>

        {/* LOGIN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">

          {/* STUDENT CARD */}
          <div className="p-6 bg-white rounded-2xl shadow-card border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-300 
                flex items-center justify-center text-white font-bold text-lg">
                ST
              </div>
              <div>
                <p className="font-semibold text-gray-900">Student</p>
                <p className="text-xs text-purple-600 font-medium">SECURE LOGIN</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              View expected vs actual timeline, upload documents, and track progress.
            </p>

            <a href="/login" className="text-purple-600 font-medium hover:underline">
              Go to student login →
            </a>
          </div>

          {/* SUPERVISOR CARD */}
          <div className="p-6 bg-white rounded-2xl shadow-card border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-300 
                flex items-center justify-center text-white font-bold text-lg">
                SV
              </div>
              <div>
                <p className="font-semibold text-gray-900">Supervisor</p>
                <p className="text-xs text-purple-600 font-medium">SECURE LOGIN</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Monitor supervisees, identify at-risk progress, and support timely completion.
            </p>

            <a href="/login" className="text-purple-600 font-medium hover:underline">
              Go to supervisor login →
            </a>
          </div>

          {/* ADMIN CARD */}
          <div className="p-6 bg-white rounded-2xl shadow-card border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-300 
                flex items-center justify-center text-white font-bold text-lg">
                AD
              </div>
              <div>
                <p className="font-semibold text-gray-900">Admin</p>
                <p className="text-xs text-purple-600 font-medium">SECURE LOGIN</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Configure programmes, monitor cohorts, and generate reports.
            </p>

            <a href="/login" className="text-purple-600 font-medium hover:underline">
              Go to admin login →
            </a>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        © 2025 PPBMS · Universiti Sains Malaysia · Built with ❤️
      </footer>

    </div>
  );
}
