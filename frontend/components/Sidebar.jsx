// components/Sidebar.jsx
export default function Sidebar() {
  return (
    <div className="text-white">
      <div className="mb-6">
        <div className="text-2xl font-extrabold">AMDI</div>
        <div className="mt-1 text-sm opacity-80">Research Portfolio</div>
      </div>

      <nav className="space-y-2">
        <button className="w-full text-left px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-3">
          <span className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">👤</span>
          <span>Student Dashboard</span>
        </button>

        <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 flex items-center gap-3">
          <span className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">📊</span>
          <span>Supervisor Dashboard</span>
        </button>

        <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 flex items-center gap-3">
          <span className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">🗂️</span>
          <span>Parts / Submissions</span>
        </button>
      </nav>
    </div>
  );
}
