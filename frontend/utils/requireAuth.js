import jwtDecode from "jwt-decode";

export function requireAuth(router) {
  const token = localStorage.getItem("ppbms_token");
  const role = localStorage.getItem("ppbms_role");

  if (!token || !role) {
    router.push("/login");
    return null;
  }

  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;

    if (decoded.exp < now) {
      localStorage.clear();
      router.push("/login");
      return null;
    }

    return { token, role };
  } catch {
    localStorage.clear();
    router.push("/login");
    return null;
  }
}
