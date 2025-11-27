// components/Sidebar.jsx
export default function Sidebar() {
  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-purple-700 to-purple-400 text-white">
      <div className="mb-6">
        <div className="text-sm opacity-90">AMDI</div>
        <div className="text-lg font-bold mt-2">Research Portfolio</div>
      </div>

      <nav className="space-y-3">
        <button className="w-full text-left bg-white/10 px-3 py-2 rounded-md flex items-center gap-3">
          <span>👩‍🎓</span> <span>Student Dashboard</span>
        </button>
        <button className="w-full text-left bg-white/8 px-3 py-2 rounded-md flex items-center gap-3">
          <span>📊</span> <span>Supervisor Dashboard</span>
        </button>
        <button className="w-full text-left bg-white/8 px-3 py-2 rounded-md flex items-center gap-3">
          <span>📁</span> <span>Parts / Submissions</span>
        </button>
      </nav>
      <div className="mt-8 text-sm opacity-90">Version 1.0</div>
    </div>
  );
}
