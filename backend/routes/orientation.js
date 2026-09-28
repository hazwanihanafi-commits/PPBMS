import express from "express";
import jwt from "jsonwebtoken";
import { google } from "googleapis";

import sendEmail from "../services/sendEmail.js";

const router = express.Router();


function auth(req, res, next) {

  const token =
    (req.headers.authorization || "")
      .replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      error: "No token"
    });
  }

  try {

    req.user =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    next();

  } catch {

    return res.status(401).json({
      error: "Invalid token"
    });

  }
}


function getAuth() {

  const credentials =
    JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    );

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets"
    ]
  });

}


async function getSheetRows() {

  const auth = getAuth();

  const client =
    await auth.getClient();

  const sheets =
    google.sheets({
      version: "v4",
      auth: client
    });


  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        process.env.SHEET_ID,

      range:
        "ORIENTATION_TRACKING!A1:I999"

    });


  const values =
    response.data.values || [];


  if (values.length < 2) {
    return [];
  }


  const headers =
    values[0].map(
      h => String(h).trim()
    );


  return values
    .slice(1)
    .map(row => {

      const obj = {};

      headers.forEach(
        (header, index) => {

          obj[header] =
            row[index] || "";

        }
      );

      return obj;

    });

}


async function findRow(email) {

  const auth = getAuth();

  const client =
    await auth.getClient();

  const sheets =
    google.sheets({
      version: "v4",
      auth: client
    });


  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        process.env.SHEET_ID,

      range:
        "ORIENTATION_TRACKING!A1:U999"

    });


  const values =
    response.data.values || [];


  if (!values.length) {
    return null;
  }


  const headers =
    values[0].map(
      h => String(h).trim()
    );


  const emailIndex =
    headers.indexOf("Email");


  const rowIndex =
    values.findIndex(
      (row, index) =>
        index > 0 &&
        String(
          row[emailIndex] || ""
        )
          .toLowerCase()
          .trim() ===
        email.toLowerCase().trim()
    );


  if (rowIndex === -1) {
    return null;
  }


  return {
    rowNumber: rowIndex + 1,
    headers,
    values: values[rowIndex]
  };

}


router.get(
  "/status",
  auth,
  async (req, res) => {

    try {

      const email =
        req.user.email;

      const row =
        await findRow(email);


      if (!row) {

        return res.json({
          status: "Not Started",
          progress: 0
        });

      }


      const obj = {};

      row.headers.forEach(
        (header, index) => {

          obj[header] =
            row.values[index] || "";

        }
      );


      res.json({

        status:
          obj.Status ||
          "Not Started",

        progress:
          Number(obj.Progress || 0),

        startedAt:
          obj["Started At"] || "",

        completedAt:
          obj["Completed At"] || "",

        version:
          obj.Version || "1.0"

      });

    } catch (error) {

      console.error(
        "Orientation status error:",
        error
      );

      res.status(500).json({
        error:
          "Unable to retrieve orientation status"
      });

    }

  }
);


router.post(
  "/complete",
  auth,
  async (req, res) => {

    try {

      const email =
        req.user.email;


      const row =
        await findRow(email);


      const auth =
        getAuth();

      const client =
        await auth.getClient();

      const sheets =
        google.sheets({
          version: "v4",
          auth: client
        });


      const now =
        new Date().toISOString();


      if (row) {

        // Existing record:
        // update status/progress/completion

        const statusCol =
          row.headers.indexOf("Status");

        const progressCol =
          row.headers.indexOf("Progress");

        const completedCol =
          row.headers.indexOf("Completed At");


        await updateCell(
          sheets,
          statusCol,
          row.rowNumber,
          "Completed"
        );


        await updateCell(
          sheets,
          progressCol,
          row.rowNumber,
          100
        );


        await updateCell(
          sheets,
          completedCol,
          row.rowNumber,
          now
        );

      } else {

        return res.status(404).json({
          error:
            "Orientation record not found."
        });

      }


      // Notify Anis
      try {

        await sendEmail({

          to:
            "anissyamimi@usm.my",

          subject:
            "PKTAAB Orientation Completed",

          text:
            `${email} has completed the PKTAAB Postgraduate Student Orientation.`,

          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6">

              <h2>
                🎓 PKTAAB Orientation Completed
              </h2>

              <p>
                A postgraduate student has completed
                the PKTAAB Student Orientation.
              </p>

              <p>
                <strong>Student Email:</strong>
                ${email}
              </p>

              <p>
                <strong>Completed:</strong>
                ${now}
              </p>

            </div>
          `

        });

      } catch (emailError) {

        console.error(
          "Orientation notification failed:",
          emailError
        );

        // Do not fail completion
        // just because email failed.

      }


      res.json({
        success: true,
        status: "Completed",
        progress: 100,
        completedAt: now
      });


    } catch (error) {

      console.error(
        "Orientation completion error:",
        error
      );

      res.status(500).json({
        error:
          "Unable to complete orientation"
      });

    }

  }
);


async function updateCell(
  sheets,
  columnIndex,
  rowNumber,
  value
) {

  if (columnIndex === -1) {
    throw new Error(
      "Required orientation column missing"
    );
  }


  let column = "";
  let n = columnIndex;


  while (n >= 0) {

    column =
      String.fromCharCode(
        (n % 26) + 65
      ) + column;

    n =
      Math.floor(n / 26) - 1;

  }


  await sheets.spreadsheets.values.update({

    spreadsheetId:
      process.env.SHEET_ID,

    range:
      `ORIENTATION_TRACKING!${column}${rowNumber}`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {
      values: [[value]]
    }

  });

}


export default router;
