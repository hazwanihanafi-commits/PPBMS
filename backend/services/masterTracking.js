import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

export async function getChecklistRow(sheetId, studentEmail) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A1:ZZ"
  });

  const [headers, ...rows] = res.data.values;

  const row = rows.find(
    r => (r[headers.indexOf("Student's Email")] || "")
      .toLowerCase() === studentEmail.toLowerCase()
  );

  if (!row) return {};

  const checklist = {};
  headers.forEach((h, i) => {
    if (h === h.toUpperCase()) checklist[h] = row[i] || "";
  });

  return checklist;
}

export async function updateChecklistCell(
  sheetId,
  studentEmail,
  headerKey,
  fileUrl
) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A1:ZZ"
  });

  const headers = res.data.values[0];
  const colIndex = headers.indexOf(headerKey);
  const emailIndex = headers.indexOf("Student's Email");

  const rows = res.data.values.slice(1);
  const rowIndex = rows.findIndex(
    r => (r[emailIndex] || "")
      .toLowerCase() === studentEmail.toLowerCase()
  );

  if (colIndex === -1 || rowIndex === -1) return;

  const colLetter = String.fromCharCode(65 + colIndex);
  const rowNumber = rowIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[fileUrl]] }
  });
}
