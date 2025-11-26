export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <header className="bg-white shadow mb-6 p-4 flex items-center gap-3">
        <div className="text-2xl font-bold text-gray-700">📘 Student Dashboard</div>
      </header>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* PROFILE CARD */}
        <div className="col-span-1 bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-teal-600 mb-3">Academic Information</h2>
          <img
            src="/avatar.png"
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
          <p className="text-center font-bold text-lg">HAMIDAH BINTI MOHD ZAIN</p>
          <p className="text-center text-gray-500">Doctor of Philosophy</p>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="bg-orange-100 p-2 rounded-lg">📩</div>
            <div className="bg-blue-100 p-2 rounded-lg">📍</div>
            <div className="bg-red-100 p-2 rounded-lg">❤️</div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-700"><b>Supervisor:</b> hazwanihanfi@usm.my</p>
          </div>
        </div>

        {/* CIRCULAR PROGRESS – LIKE SAMPLE */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-teal-600 mb-4">Completion Status</h2>
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="absolute top-0 left-0" viewBox="0 0 36 36">
                <path
                  className="text-gray-300"
                  strokeWidth="3"
                  fill="none"
                  stroke="currentColor"
                  d="M18 2 A16 16 0 1 1 17.9 2"
                />
                <path
                  className="text-green-500"
                  strokeWidth="3"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="60, 100" 
                  d="M18 2 A16 16 0 1 1 17.9 2"
                />
              </svg>
              <p className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                60%
              </p>
            </div>
          </div>
        </div>

        {/* WITHDRAWAL HISTORY CARD */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-teal-600 mb-3">Milestones Completed</h2>
          <p className="text-4xl font-bold text-green-600">2</p>
          <p className="text-gray-500">out of 4</p>
        </div>

        {/* FEES / STATUS CARD */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-teal-600 mb-3">Latest Submission</h2>
          <p className="text-4xl font-bold text-blue-600">P3</p>
          <p className="text-gray-500">submitted on 12 Jan 2025</p>
        </div>

        {/* UPCOMING DEADLINES */}
        <div className="col-span-2 bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-teal-600 mb-4">Upcoming Deadlines</h2>
          <ul className="text-gray-700 leading-7">
            <li>📅 P4 Submission — <b>15 Feb 2025</b></li>
            <li>📅 Progress Review — <b>28 Feb 2025</b></li>
            <li>📅 Thesis Target — <b>Dec 2025</b></li>
          </ul>
        </div>

        {/* WARNING CARD */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-red-600 mb-3">Alerts</h2>
          <p className="text-gray-700">⚠ You are 2 weeks behind schedule.</p>
        </div>

        {/* KPI CARD */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-teal-600 mb-3">Research KPIs</h2>
          <ul className="text-gray-700 leading-7">
            <li>📄 Publications: <b>1</b></li>
            <li>🎤 Conferences: <b>2</b></li>
            <li>🧪 Ethics Approval: <b>Completed</b></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
