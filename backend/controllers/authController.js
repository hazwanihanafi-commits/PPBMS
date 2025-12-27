import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  readMasterTracking,
  updatePasswordHash,
} from "../services/googleSheets.js";

/* ===============================
   LOGIN
=============================== */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const normalizedEmail = email.toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const user = rows.find(
      r =>
        (r["Student's Email"] || "").toLowerCase().trim() === normalizedEmail ||
        (r["Main Supervisor's Email"] || "")
          .toLowerCase()
          .trim() === normalizedEmail
    );

    if (!user) return res.status(401).json({ error: "User not found" });

    /* FIRST LOGIN */
    if (!user.PASSWORD_HASH) {
      return res.json({
        requirePasswordSetup: true,
        email: normalizedEmail,
        role: detectRole(user),
      });
    }

    /* NORMAL LOGIN */
    if (!password)
      return res.status(400).json({ error: "Password required" });

    const ok = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!ok) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { email: normalizedEmail, role: detectRole(user) },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({ token, role: detectRole(user), email: normalizedEmail });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    res.status(500).json({ error: "Login failed" });
  }
}

/* ===============================
   SET PASSWORD (ONCE)
=============================== */
export async function setPassword(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing data" });

    const normalizedEmail = email.toLowerCase().trim();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const user = rows.find(
      r =>
        (r["Student's Email"] || "").toLowerCase().trim() === normalizedEmail ||
        (r["Main Supervisor's Email"] || "")
          .toLowerCase()
          .trim() === normalizedEmail
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.PASSWORD_HASH)
      return res.status(400).json({ error: "Password already set" });

    const hash = await bcrypt.hash(password, 10);
    await updatePasswordHash({ email: normalizedEmail, hash });

    res.json({ success: true });
  } catch (e) {
    console.error("SET PASSWORD ERROR:", e);
    res.status(500).json({ error: "Failed to set password" });
  }
}

/* ===============================
   ROLE DETECTION
=============================== */
function detectRole(row) {
  if (row.Role) return row.Role;
  if (row["Student's Email"]) return "student";
  if (row["Main Supervisor's Email"]) return "supervisor";
  return "admin";
}
