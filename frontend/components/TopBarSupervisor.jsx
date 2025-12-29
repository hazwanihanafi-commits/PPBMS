import { useRouter } from "next/router";

export default function TopBarSupervisor({ user }) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("ppbms_token");
    localStorage.removeItem("ppbms_role");
    router.push("/login");
  }

  return (
    <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <span className="text-xl font-extrabold text-purple-700">
          PPBMS
        </span>
        <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
          SUPERVISOR
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.email}
        </span>
        <button
          onClick={logout}
          className="text-sm font-semibold text-red-600 hover:underline"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
