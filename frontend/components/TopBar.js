import { logout } from "@/utils/logout";

export default function TopBar({ user }) {
  return (
    <header className="w-full bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <div className="text-xl font-semibold text-purple-700">PPBMS</div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500">Logged in as</div>
            <div className="text-sm font-medium text-gray-800">
              {user?.email || "Unknown user"}
            </div>
          </div>

          {user?.role && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              {user.role.toUpperCase()}
            </span>
          )}

          <button
            onClick={logout}
            className="text-sm text-red-600 hover:text-red-700 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
