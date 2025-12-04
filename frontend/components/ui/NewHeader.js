export default function NewHeader() {
  return (
    <header className="w-full py-5 px-8 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-orange-400 flex items-center justify-center text-white text-lg font-bold">
          P
        </div>

        <div>
          <h1 className="font-semibold text-lg text-gray-900">PPBMS</h1>
          <p className="text-xs text-gray-500 -mt-1">
            Postgraduate Progress & Benchmarking System
          </p>
        </div>
      </div>

      <a
        href="/login"
        className="px-6 py-2 rounded-full bg-purple-600 text-white font-medium hover:bg-purple-700 transition"
      >
        General Login
      </a>
    </header>
  );
}
