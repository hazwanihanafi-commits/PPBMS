// backend/routes/admin.js
import express from "express";
import jwt from "jsonwebtoken";
import { getCachedSheet, resetSheetCache } from "../utils/sheetCache.js";

const router = express.Router();

/* ============================================================
   ADMIN MIDDLEWARE (JWT + role check)
===============================================================*/
function adminOnly(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");

  if (!token)
    return res.status(401).json({ error: "Missing token" });

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);

    if (data.role !== "admin")
      return res.status(401).json({ error: "Admin only" });

    req.user = data;
    next();
  } catch (err) {
    console.error("adminOnly error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
/* ============================================================
   GET AT-RISK STUDENTS
   - A student is “late” if any Expected date < today AND Actual is empty
===============================================================*/
router.get("/at-risk", adminOnly, async (req, res) => {
  try {
    const rows = await getCachedSheet(process.env.SHEET_ID);
    const today = new Date();

    const atRisk = [];

    rows.forEach((row) => {
      const student = {
        name: row["Student Name"] || "-",
        email: row["Student's Email"] || "-",
        supervisor: row["Main Supervisor"] || "-",
        lateActivities: []
      };

      // Loop through all columns to find timeline fields
      Object.keys(row).forEach((col) => {
        if (col.includes("Expected")) {
          const activity = col.replace(" - Expected", "");
          const expected = row[col];
          const actual = row[`${activity} - Actual`];

          if (expected && !actual) {
            const expDate = new Date(expected);

            if (expDate < today) {
              student.lateActivities.push({
                activity,
                expected,
                actual: actual || null
              });
            }
          }
        }
      });

      if (student.lateActivities.length > 0) {
        atRisk.push(student);
      }
    });

    return res.json({ atRisk });

  } catch (err) {
    console.error("AT-RISK ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   GET ALL STUDENTS (FULL GOOGLE SHEET)
===============================================================*/
router.get("/all-students", adminOnly, async (req, res) => {
  try {
    const rows = await getCachedSheet(process.env.SHEET_ID);

    return res.json({
      total: rows.length,
      students: rows,
    });
  } catch (err) {
    console.error("ADMIN all-students error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   LIST ALL SUPERVISORS
===============================================================*/
router.get("/supervisors", adminOnly, async (req, res) => {
  try {
    const rows = await getCachedSheet(process.env.SHEET_ID);

    const supervisors = rows
      .map((r) => ({
        name: r["Main Supervisor"] || "",
        email: r["Main Supervisor's Email"] || "",
        field: r["Field"] || "",
        programme: r["Programme"] || "",
      }))
      .filter((x) => x.email) // remove empty rows
      .reduce((unique, item) => {
        if (!unique.some((u) => u.email === item.email)) unique.push(item);
        return unique;
      }, []);

    return res.json({ supervisors });
  } catch (err) {
    console.error("ADMIN supervisors error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   GET PROGRAMME SUMMARY
===============================================================*/
router.get("/programmes", adminOnly, async (req, res) => {
  try {
    const rows = await getCachedSheet(process.env.SHEET_ID);

    const programmes = {};

    rows.forEach((r) => {
      const p = r["Programme"] || "Unknown";
      programmes[p] = (programmes[p] || 0) + 1;
    });

    return res.json({ programmes });
  } catch (err) {
    console.error("ADMIN programme error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   CLEAR GOOGLE SHEET CACHE
===============================================================*/
router.post("/reset-cache", adminOnly, (req, res) => {
  try {
    resetSheetCache();
    return res.json({ ok: true, message: "Cache cleared successfully" });
  } catch (err) {
    console.error("reset-cache error:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/student/:email", adminOnly, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();
    const rows = await getCachedSheet(process.env.SHEET_ID);

    const raw = rows.find(
      r => (r["Student's Email"] || "").toLowerCase().trim() === email
    );

    if (!raw)
      return res.status(404).json({ error: "Student not found" });

    const documents = {};
    Object.entries(DOC_COLUMN_MAP).forEach(([label, col]) => {
      documents[label] = raw[col] || "";
    });

    return res.json({
      row: {
        student_name: raw["Student Name"] || "-",
        email: raw["Student's Email"] || "-",
        programme: raw["Programme"] || "-",
        department: raw["Department"] || "-",
        documents,
      },
    });

  } catch (err) {
    console.error("ADMIN student error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
