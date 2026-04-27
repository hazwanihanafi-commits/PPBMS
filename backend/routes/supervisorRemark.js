import express from "express";
import jwt from "jsonwebtoken";
import {
  readSUPERVISOR_REMARKS,
  upsertSUPERVISOR_REMARK
} from "../services/googleSheets.js";

const router = express.Router();

/* =========================
   AUTH MIDDLEWARE
========================= */
function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || "")
      .replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "No token provided"
      });
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET);

    next();

  } catch (e) {
    console.error("AUTH ERROR:", e);

    return res.status(401).json({
      error: "Invalid token"
    });
  }
}

/* =========================
   SAVE / AUTOSAVE REMARK
========================= */
router.post("/remark", auth, async (req, res) => {
  try {

    console.log("========== REMARK API ==========");

    console.log("REQ BODY:", req.body);

    console.log("REQ USER:", req.user);

    const {
      studentMatric,
      studentEmail,
      assessmentType,
      remark
    } = req.body;

    /* =========================
       VALIDATION
    ========================= */

    if (!studentEmail) {
      return res.status(400).json({
        error: "studentEmail is required"
      });
    }

    if (!assessmentType) {
      return res.status(400).json({
        error: "assessmentType is required"
      });
    }

    if (remark === undefined || remark === null) {
      return res.status(400).json({
        error: "remark is required"
      });
    }

    console.log("VALIDATION PASSED");

    const payload = {
      studentMatric: studentMatric || "",
      studentEmail,
      assessmentType,
      supervisorEmail: req.user.email,
      remark
    };

    console.log("UPSERT PAYLOAD:", payload);

    /* =========================
       SAVE TO GOOGLE SHEETS
    ========================= */

    const result = await upsertSUPERVISOR_REMARK(payload);

    console.log("UPSERT RESULT:", result);

    console.log("========== SUCCESS ==========");

    return res.json({
      success: true,
      message: "Remark saved successfully"
    });

  } catch (e) {

    console.error("========== SAVE REMARK ERROR ==========");
    console.error(e);
    console.error("STACK:", e.stack);

    return res.status(500).json({
      error: e.message,
      stack: e.stack
    });
  }
});

/* =========================
   GET REMARKS
========================= */
router.get("/remark/:studentEmail", auth, async (req, res) => {
  try {

    const { studentEmail } = req.params;

    console.log("GET REMARKS FOR:", studentEmail);

    const remarks = await readSUPERVISOR_REMARKS(studentEmail);

    return res.json({
      success: true,
      remarks
    });

  } catch (e) {

    console.error("GET REMARKS ERROR:", e);

    return res.status(500).json({
      error: e.message
    });
  }
});

export default router;
