import Link from "next/link";

export default function Header(){
  return (
    <header className="bg-white/90 backdrop-blur sticky top-0 z-40 border-b">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/"><a className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-usm-500 to-usm-300 flex items-center justify-center text-white font-bold">PP</div>
          <div className="hidden sm:block">
            <div className="text-lg font-bold text-usm-700">PPBMS</div>
            <div className="text-xs text-gray-500">Student progress & milestones</div>
          </div>
        </a></Link>

        <nav className="flex items-center gap-4">
          <Link href="/supervisor"><a className="text-sm text-gray-700 hover:text-usm-700">Supervisor</a></Link>
          <Link href="/student"><a className="text-sm text-gray-700 hover:text-usm-700">Student</a></Link>
        </nav>
      </div>
    </header>
  );
}
