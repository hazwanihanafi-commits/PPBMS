import express from "express";
import crypto from "crypto";
import { readMasterTracking } from "../services/googleSheets.js";

const router = express.Router();

/**
 * REQUEST PASSWORD SETUP
 * POST /auth/request-set-password
 */
router.post("/request-set-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email required" });

    const cleanEmail = email.toLowerCase().trim();

    // Check Google Sheet (student or supervisor)
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const found = rows.find(
      r =>
        (r["Student's Email"] || "").toLowerCase().trim() === cleanEmail ||
        (r["Main Supervisor's Email"] || "").toLowerCase().trim() === cleanEmail
    );

    if (!found) {
      return res.status(404).json({ error: "Email not recognised" });
    }

    // TEMP: no email yet, just approve
    // Later you will generate token + email link
    return res.json({ success: true });

  } catch (err) {
    console.error("REQUEST PASSWORD ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
