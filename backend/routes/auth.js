import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

/**
 * LOGIN:
 * - Accept ANY email that exists in MasterTracking Sheet
 * - Password = "1234" for now
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    // For now, universal password (you can upgrade later)
    if (password !== "1234")
      return res.status(401).json({ error: "Wrong password" });

    const cleanEmail = email.toLowerCase().trim();

    // Read Google Sheet
    const rows = await readMasterTracking(process.env.SHEET_ID);

    // Find student
    const student = rows.find(
      (r) =>
        (r["Student's Email"] || "").toLowerCase().trim() === cleanEmail
    );

    // Find supervisor
    const supervisor = rows.find(
      (r) =>
        (r["Main Supervisor's Email"] || "").toLowerCase().trim() === cleanEmail
    );

    if (!student && !supervisor) {
      return res.status(401).json({ error: "Email not found in system" });
    }

    const role = supervisor ? "supervisor" : "student";

    const token = jwt.sign({ email: cleanEmail, role }, process.env.JWT_SECRET);

    return res.json({ token, role });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
