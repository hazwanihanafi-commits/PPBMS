export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
      
      {/* PAGE HEADER */}
      <h1 className="text-3xl font-bold text-purple-700 mb-6">
        Admin Dashboard
      </h1>

      <p className="text-gray-600 mb-6">
        Welcome to the PPBMS Admin Panel.  
        Manage programmes, cohorts, supervisors, and student progress.
      </p>

      {/* SECTION EXAMPLE */}
      <div className="bg-white rounded-2xl shadow p-6 border border-gray-100 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          System Tools
        </h2>

        <ul className="list-disc pl-6 text-gray-700">
          <li>View all students from Google Sheet</li>
          <li>Monitor late / at-risk students</li>
          <li>Reset Google Sheet cache</li>
          <li>Configure roles (coming soon)</li>
        </ul>
      </div>

    </div>
  );
}
