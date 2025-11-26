import express from "express";
import { getSheetsClientFromEnv, writeCell } from "../_helpers/googleSheets.js";

const router = express.Router();

// Approve
router.post("/approve", async (req, res) => {
  try {
    const { studentEmail, milestone } = req.body;

    const sheets = await getSheetsClientFromEnv();
    const tabName = "MasterTracking";

    const approvalColumn = {
      "P1": "F",
      "P3": "H",
      "P4": "J",
      "P5": "L"
    }[milestone];

    if (!approvalColumn)
      return res.status(400).send("Invalid milestone");

    // Find row
    const rows = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: `${tabName}!A:L`,
    });

    const index = rows.data.values.findIndex(r => r[2] === studentEmail);
    if (index < 0) return res.status(404).send("Student not found");

    const rowNum = index + 1;

    // Approve: write today date
    await writeCell(
      sheets,
      tabName,
      `${approvalColumn}${rowNum}`,
      new Date().toISOString().substring(0, 10)
    );

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error approving milestone");
  }
});

// Reject
router.post("/reject", async (req, res) => {
  try {
    const { studentEmail, milestone } = req.body;

    const sheets = await getSheetsClientFromEnv();
    const tabName = "MasterTracking";

    const approvalColumn = {
      "P1": "F",
      "P3": "H",
      "P4": "J",
      "P5": "L"
    }[milestone];

    if (!approvalColumn)
      return res.status(400).send("Invalid milestone");

    const rows = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: `${tabName}!A:L`,
    });

    const index = rows.data.values.findIndex(r => r[2] === studentEmail);
    if (index < 0) return res.status(404).send("Student not found");

    const rowNum = index + 1;

    // Write "Rejected"
    await writeCell(sheets, tabName, `${approvalColumn}${rowNum}`, "REJECTED");

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error rejecting milestone");
  }
});

export default router;
