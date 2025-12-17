import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import {
  getMyDocuments,
  getDocumentsByStudent,
  saveLink,
} from "../services/documentsService.js";

const router = express.Router();

/**
 * Student: get own documents
 */
router.get("/my", verifyToken, async (req, res) => {
  try {
    const docs = await getMyDocuments(req.user.email);
    res.status(200).json(docs);
  } catch (err) {
    console.error(err);
    res.status(200).json([]);
  }
});

/**
 * Supervisor: get student documents
 */
router.get("/student/:email", verifyToken, async (req, res) => {
  try {
    const docs = await getDocumentsByStudent(req.params.email);
    res.status(200).json(docs);
  } catch (err) {
    console.error(err);
    res.status(200).json([]);
  }
});

/**
 * Student: save pasted link
 */
router.post("/save-link", verifyToken, async (req, res) => {
  try {
    const { section, document_type, file_url } = req.body;

    if (!file_url) {
      return res.status(400).json({ error: "Missing file URL" });
    }

    const row = await saveLink({
      studentEmail: req.user.email,
      section,
      documentType: document_type,
      fileUrl: file_url,
    });

    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Save failed" });
  }
});

export default router;
