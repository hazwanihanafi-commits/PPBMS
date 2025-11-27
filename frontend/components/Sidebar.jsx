// components/Sidebar.jsx
export default function Sidebar() {
  return (
    <div className="text-white">
      <div className="mb-6">
        <div className="text-lg font-bold">AMDI</div>
        <div className="text-sm opacity-90">Research Portfolio</div>
      </div>

      <nav className="space-y-3">
        <button className="w-full text-left bg-white/10 px-3 py-2 rounded-md">👤 Student Dashboard</button>
        <button className="w-full text-left bg-white/10 px-3 py-2 rounded-md">📊 Supervisor Dashboard</button>
        <button className="w-full text-left bg-white/10 px-3 py-2 rounded-md">📁 Parts / Submissions</button>
      </nav>
    </div>
  );
}
