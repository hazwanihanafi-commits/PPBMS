import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();


/* ============================================================
   ADMIN LOGIN (separate credentials)
===============================================================*/
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "";

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ error: "Admin credentials missing" });
    }

    // Compare login input with env
    if (email.toLowerCase().trim() !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ error: "Wrong password" });
    }

    // Generate token for admin
    const token = jwt.sign(
      { email: adminEmail, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, role: "admin" });

  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
