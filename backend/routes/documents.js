import express from "express";
import jwt from "jsonwebtoken";
import { readMasterTracking, writeSheetCell } from "../services/googleSheets.js";

const router = express.Router();

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  req.user = jwt.verify(token, process.env.JWT_SECRET);
  next();
}

/* MASTER TRACKING COLUMN MAP */
const COLUMN_MAP = {
  "Development Plan & Learning Contract (DPLC)": "DPLC",
  "Student Supervision Logbook": "SUPERVISION_LOG",
  "Annual Progress Review – Year 1": "APR_Y1",
  "Annual Progress Review – Year 2": "APR_Y2",
  "Annual Progress Review – Year 3 (Final Year)": "APR_Y3",
};

/* SAVE LINK → MASTER TRACKING */
router.post("/save-link", auth, async (req, res) => {
  try {
    const { document_type, file_url } = req.body;

    const column = COLUMN_MAP[document_type];
    if (!column) {
      return res.status(400).json({ error: "Invalid document type" });
    }

    const email = req.user.email.toLowerCase();
    const rows = await readMasterTracking(process.env.SHEET_ID);

    const idx = rows.findIndex(
      r => (r["Student's Email"] || "").toLowerCase() === email
    );

    if (idx === -1) {
      return res.status(404).json({ error: "Student not found" });
    }

    await writeSheetCell(
      process.env.SHEET_ID,
      column,
      idx + 2,
      file_url
    );

    res.json({ ok: true, file_url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Save failed" });
  }
});

export default router;
