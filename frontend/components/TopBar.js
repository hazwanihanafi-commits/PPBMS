import { useRouter } from "next/router";
import { logout } from "@/utils/logout";

export default function TopBar({ user, showBack = false }) {
  const router = useRouter();

  return (
    <header className="w-full bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <div className="text-xl font-semibold text-purple-700">
            PPBMS
          </div>

          {/* Back to Admin Dashboard */}
          {showBack && (
            <button
              onClick={() => router.push("/admin")}
              className="text-sm text-purple-600 hover:underline"
            >
              ← Back to Admin Dashboard
            </button>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          
          {/* Role badge only (NO EMAIL) */}
          {user?.role && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              {user.role.toUpperCase()}
            </span>
          )}

          {/* Logout */}
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
