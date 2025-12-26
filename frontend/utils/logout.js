export function logout() {
  localStorage.removeItem("ppbms_token");
  localStorage.removeItem("ppbms_role");
  localStorage.removeItem("ppbms_email");

  // hard redirect to clear memory state
  window.location.href = "/login";
}
