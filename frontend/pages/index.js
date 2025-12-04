import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      
      {/* Top Badge */}
      <section className="max-w-6xl mx-auto px-6 pt-20">
        <div className="inline-block bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-medium mb-6">
          IPPT · USM · Research Progress
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          Monitor postgraduate <br />
          <span className="text-purple-600">research progress</span> <br />
          in one simple dashboard.
        </h1>

        <p className="mt-6 text-lg text-gray-700 max-w-3xl">
          Secure web platform for tracking MSc and PhD milestones, supervisor monitoring,
          and documentation — tailored for IPPT / USM research programmes.
        </p>

        {/* Login Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/login?role=student">
            <span className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold shadow hover:bg-purple-700 cursor-pointer">
              Login as Student
            </span>
          </Link>

          <Link href="/login?role=supervisor">
            <span className="px-6 py-3 bg-white border border-purple-300 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 cursor-pointer">
              Login as Supervisor
            </span>
          </Link>

          <Link href="/login?role=admin">
            <span className="px-6 py-3 bg-white border border-purple-300 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 cursor-pointer">
              Login as Admin
            </span>
          </Link>
        </div>
      </section>

      {/* Cards Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* Student Card */}
        <div className="p-6 bg-white rounded-2xl shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg font-bold">
            ST
          </div>
          <h3 className="mt-4 text-xl font-semibold">Student</h3>
          <p className="text-sm text-purple-600 font-semibold">SECURE LOGIN</p>
          <p className="text-gray-600 mt-2">
            View your expected vs actual timeline, upload documents, and
            track progress toward completion.
          </p>
          <Link href="/login?role=student">
            <span className="text-purple-600 font-medium mt-3 inline-block cursor-pointer">
              Go to student login →
            </span>
          </Link>
        </div>

        {/* Supervisor Card */}
        <div className="p-6 bg-white rounded-2xl shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg font-bold">
            SV
          </div>
          <h3 className="mt-4 text-xl font-semibold">Supervisor</h3>
          <p className="text-sm text-purple-600 font-semibold">SECURE LOGIN</p>
          <p className="text-gray-600 mt-2">
            Monitor your supervisees, identify at-risk students,
            and support timely completion.
          </p>
          <Link href="/login?role=supervisor">
            <span className="text-purple-600 font-medium mt-3 inline-block cursor-pointer">
              Go to supervisor login →
            </span>
          </Link>
        </div>

        {/* Admin Card */}
        <div className="p-6 bg-white rounded-2xl shadow">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg font-bold">
            AD
          </div>
          <h3 className="mt-4 text-xl font-semibold">Admin</h3>
          <p className="text-sm text-purple-600 font-semibold">SECURE LOGIN</p>
          <p className="text-gray-600 mt-2">
            Configure programmes, monitor cohorts, and generate reports for
            quality assurance.
          </p>
          <Link href="/login?role=admin">
            <span className="text-purple-600 font-medium mt-3 inline-block cursor-pointer">
              Go to admin login →
            </span>
          </Link>
        </div>

      </section>
    </div>
  );
}
