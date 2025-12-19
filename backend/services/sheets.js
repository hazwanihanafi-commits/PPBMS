import { google } from "googleapis";

const sheets = google.sheets("v4");
const SPREADSHEET_ID = process.env.SHEET_ID;

export async function getAssessmentPLO(studentEmail) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "ASSESSMENT_PLO!A1:Z",
  });

  const [header, ...rows] = res.data.values;

  return rows
    .map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])))
    .filter(r => r.Student_Email === studentEmail)
    // ensure order: TRX500 → Annual → Viva
    .sort((a, b) => {
      const order = { TRX500: 1, "Annual Review": 2, Viva: 3 };
      return order[a.Assessment_Type] - order[b.Assessment_Type];
    });
}
