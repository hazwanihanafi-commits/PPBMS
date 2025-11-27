// components/TopNavbar.jsx
export default function TopNavbar() {
  return (
    <nav className="w-full bg-gradient-to-r from-purple-600 to-orange-400 text-white shadow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-lg font-extrabold">AMDI</div>
          <div className="text-sm opacity-90">Research Portfolio</div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button className="bg-white/20 px-3 py-1 rounded-full text-sm">Student Dashboard</button>
          <button className="bg-white/20 px-3 py-1 rounded-full text-sm">Supervisor Dashboard</button>
          <button className="bg-white/20 px-3 py-1 rounded-full text-sm">Parts / Submissions</button>
        </div>
      </div>
    </nav>
  );
}
