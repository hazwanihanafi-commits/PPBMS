const handleLogin = () => {
  fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),   // <- NO PASSWORD
  })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem("ppbms_token", data.token);
        localStorage.setItem("ppbms_user_email", data.email);
        localStorage.setItem("ppbms_role", data.role);

        if (data.role === "supervisor") {
          router.push("/supervisor");
        } else {
          router.push("/student/me");
        }
      } else {
        setError("Invalid login");
      }
    })
    .catch(() => setError("Error logging in"));
};
