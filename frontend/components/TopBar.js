import { useRouter } from "next/router";

export default function TopBar() {
  const router = useRouter();
  const email = typeof window !== "undefined"
    ? localStorage.getItem("ppbms_email")
    : "";

  function handleLogout() {
    localStorage.clear();
    router.push("/login");
  }

  return (
    <div className="flex justify-between items-center 
                    px-6 py-4 bg-white shadow-sm">
      <div className="font-bold text-purple-700">PPBMS</div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{email}</span>
        <button
          onClick={handleLogout}
          className="text-sm font-semibold text-red-600 hover:underline"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
