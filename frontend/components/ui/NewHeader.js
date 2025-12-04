export default function NewHeader() {
  return (
    <header className="w-full border-b bg-white/80 backdrop-blur-md shadow-sm py-4 px-8 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-orange-400 flex items-center justify-center text-white font-bold">
          P
        </div>
        <div>
          <h1 className="font-semibold text-lg text-gray-900">PPBMS</h1>
          <p className="text-xs text-gray-500 -mt-1">
            Postgraduate Progress & Benchmarking System
          </p>
        </div>
      </div>

      <nav className="flex gap-6 text-sm font-medium text-gray-700">
        <a href="/student/login" className="hover:text-purple-700">Student</a>
        <a href="/supervisor/login" className="hover:text-purple-700">Supervisor</a>
        <a href="/admin/login" className="hover:text-purple-700">Admin</a>
      </nav>
    </header>
  );
}
