export default function Home() {
  return (
    <div className="px-6 md:px-16 py-14">

      {/* Header Branding */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-orange-400 flex items-center justify-center text-white font-bold text-xl">
          P
        </div>
        <div>
          <h1 className="font-bold text-xl text-gray-900">PPBMS</h1>
          <p className="text-sm text-gray-500">
            Postgraduate Progress & Benchmarking System
          </p>
        </div>
      </div>

      {/* MAIN TITLE */}
      <div className="max-w-3xl mb-10">
        <div className="inline-block bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm mb-4">
          IPPT · USM · Research Progress
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          Monitor postgraduate
          <span className="text-purple-700"> research progress </span>
          in one simple dashboard.
        </h1>

        <p className="mt-6 text-lg text-gray-600">
          Secure web platform for tracking MSc and PhD milestones, supervisor 
          monitoring, and documentation — tailored for IPPT / USM research programmes.
        </p>
      </div>

      {/* LOGIN BUTTONS */}
      <div className="flex flex-wrap gap-4 mb-14">
        <a href="/student/login" className="px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700">
          Login as Student
        </a>

        <a href="/supervisor/login" className="px-6 py-3 border border-purple-500 text-purple-700 rounded-full hover:bg-purple-50">
          Login as Supervisor
        </a>

        <a href="/admin/login" className="px-6 py-3 border border-purple-500 text-purple-700 rounded-full hover:bg-purple-50">
          Login as Admin
        </a>
      </div>

      {/* ROLE CARDS ROW */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Student Card */}
        <div className="p-6 bg-white rounded-2xl shadow-soft border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-200 text-purple-700 flex items-center justify-center font-bold">
              ST
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Student</h3>
              <p className="text-xs text-purple-600 font-medium">SECURE LOGIN</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            View your expected vs actual timeline, upload documents, and track progress toward completion.
          </p>

          <a href="/student/login" className="text-purple-600 text-sm font-medium mt-3 inline-block">
            Go to student login →
          </a>
        </div>

        {/* Supervisor Card */}
        <div className="p-6 bg-white rounded-2xl shadow-soft border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-200 text-purple-700 flex items-center justify-center font-bold">
              SV
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Supervisor</h3>
              <p className="text-xs text-purple-600 font-medium">SECURE LOGIN</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Monitor all your supervisees, identify at-risk progress, and support timely completion.
          </p>

          <a href="/supervisor/login" className="text-purple-600 text-sm font-medium mt-3 inline-block">
            Go to supervisor login →
          </a>
        </div>

        {/* Admin Card */}
        <div className="p-6 bg-white rounded-2xl shadow-soft border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-200 text-orange-700 flex items-center justify-center font-bold">
              AD
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Admin</h3>
              <p className="text-xs text-purple-600 font-medium">SECURE LOGIN</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Configure programmes, monitor cohorts, and generate reports for quality assurance.
          </p>

          <a href="/admin/login" className="text-purple-600 text-sm font-medium mt-3 inline-block">
            Go to admin login →
          </a>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="mt-16 text-sm text-gray-500">
        © 2025 PPBMS · Universiti Sains Malaysia · Built with ♥
      </footer>

    </div>
  );
}
