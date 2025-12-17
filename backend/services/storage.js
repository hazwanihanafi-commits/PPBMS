import { google } from "googleapis";
import { Readable } from "stream";

export async function saveFileToStorage(file) {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

  const credentials = JSON.parse(raw);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth });

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID");

  const response = await drive.files.create({
    requestBody: {
      name: file.originalname,
      mimeType: file.mimetype,
      parents: [folderId],
    },
    media: {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    },
  });

  return `https://drive.google.com/file/d/${response.data.id}/view`;
}
