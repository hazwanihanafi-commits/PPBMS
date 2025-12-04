// backend/routes/jotform_dplc.js
import express from "express";
import { readMasterTracking, writeStudentActual } from "../services/googleSheets.js";

const router = express.Router();

router.post("/jotform/dplc", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const activity = "Development Plan & Learning Contract";
    // JotForm’s file URL field name might vary; adjust if necessary
    const file_url = req.body.pdf || req.body.file || req.body["upload_PDF"] || "";

    if (!email || !file_url) {
      return res.status(400).json({ error: "Missing email or file URL" });
    }

    // Find student row
    const rows = await readMasterTracking(process.env.SHEET_ID);
    const idx = rows.findIndex(r =>
      (r["Student's Email"] || "").toLowerCase().trim() === email
    );
    if (idx === -1) return res.status(404).json({ error: "Student not found" });

    const rowNumber = idx + 2;  // account for header row
    const today = new Date().toISOString().slice(0, 10);

    // Write actual date + file link
    await writeStudentActual(
      process.env.SHEET_ID,
      rowNumber,
      `${activity} - Actual`,
      `${activity} - FileURL`,
      today,
      file_url
    );

    console.log("✅ JotForm upload saved for", email, activity);
    return res.json({ ok: true });
  } catch (err) {
    console.error("JotForm webhook error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
