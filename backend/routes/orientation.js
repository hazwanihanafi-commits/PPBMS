import express from "express";
import jwt from "jsonwebtoken";
import { google } from "googleapis";

import sendEmail from "../services/sendEmail.js";

const router = express.Router();

const SHEET_NAME = "ORIENTATION_TRACKING";
const SHEET_RANGE = `${SHEET_NAME}!A1:U999`;

const ANIS_EMAIL = "anissyamimi@usm.my";


/* =========================================================
   AUTH
========================================================= */

function auth(req, res, next) {

  const token =
    (req.headers.authorization || "")
      .replace("Bearer ", "")
      .trim();

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

  } catch (error) {

    console.error(
      "Orientation auth error:",
      error
    );

    return res.status(401).json({
      error: "Invalid token"
    });

  }
}


/* =========================================================
   GOOGLE SHEETS AUTH
========================================================= */

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


/* =========================================================
   GET SHEET CLIENT
========================================================= */

async function getSheetsClient() {

  const auth = getAuth();

  const client =
    await auth.getClient();

  return google.sheets({
    version: "v4",
    auth: client
  });

}


/* =========================================================
   READ ORIENTATION SHEET
========================================================= */

async function getSheetData() {

  const sheets =
    await getSheetsClient();

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        process.env.SHEET_ID,

      range:
        SHEET_RANGE

    });

  const values =
    response.data.values || [];

  if (!values.length) {

    return {
      sheets,
      headers: [],
      rows: []
    };

  }

  const headers =
    values[0].map(
      header =>
        String(header || "").trim()
    );

  const rows =
    values.slice(1);

  return {
    sheets,
    headers,
    rows
  };

}


/* =========================================================
   FIND STUDENT ROW BY USM EMAIL
========================================================= */

async function findRow(email) {

  const {
    sheets,
    headers,
    rows
  } =
    await getSheetData();


  if (!headers.length) {

    return null;

  }


  // YOUR SHEET USES "USM Email"
  const emailIndex =
    headers.indexOf("USM Email");


  if (emailIndex === -1) {

    throw new Error(
      'Column "USM Email" not found in ORIENTATION_TRACKING'
    );

  }


  const targetEmail =
    String(email || "")
      .trim()
      .toLowerCase();


  const rowIndex =
    rows.findIndex(
      row =>
        String(
          row[emailIndex] || ""
        )
          .trim()
          .toLowerCase() ===
        targetEmail
    );


  if (rowIndex === -1) {

    return null;

  }


  const actualRowNumber =
    rowIndex + 2;


  return {

    sheets,

    rowNumber:
      actualRowNumber,

    headers,

    values:
      rows[rowIndex]

  };

}


/* =========================================================
   CONVERT ROW TO OBJECT
========================================================= */

function rowToObject(row) {

  const obj = {};

  row.headers.forEach(
    (header, index) => {

      obj[header] =
        row.values[index] || "";

    }
  );

  return obj;

}


/* =========================================================
   GET COLUMN INDEX
========================================================= */

function getColumnIndex(
  headers,
  columnName
) {

  const index =
    headers.indexOf(columnName);

  if (index === -1) {

    throw new Error(
      `Column "${columnName}" not found in ${SHEET_NAME}`
    );

  }

  return index;

}


/* =========================================================
   COLUMN NUMBER → LETTER
========================================================= */

function columnLetter(columnIndex) {

  let column = "";

  let n =
    columnIndex;

  while (n >= 0) {

    column =
      String.fromCharCode(
        (n % 26) + 65
      ) + column;

    n =
      Math.floor(n / 26) - 1;

  }

  return column;

}


/* =========================================================
   UPDATE ONE CELL
========================================================= */

async function updateCell(
  sheets,
  headers,
  rowNumber,
  columnName,
  value
) {

  const columnIndex =
    getColumnIndex(
      headers,
      columnName
    );

  const column =
    columnLetter(
      columnIndex
    );


  await sheets.spreadsheets.values.update({

    spreadsheetId:
      process.env.SHEET_ID,

    range:
      `${SHEET_NAME}!${column}${rowNumber}`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {
      values: [
        [value]
      ]
    }

  });

}


/* =========================================================
   STATUS
========================================================= */

router.get(
  "/status",
  auth,
  async (req, res) => {

    try {

      const email =
        req.user.email;


      const row =
        await findRow(email);


      /*
       * Student has not yet been added
       * to Orientation Tracking.
       */

      if (!row) {

        return res.json({

          status:
            "Not Started",

          progress:
            0,

          email

        });

      }


      const obj =
        rowToObject(row);


      const orientationStatus =
        obj["Orientation Status"] ||
        "Not Started";


      const progress =
        orientationStatus ===
        "Completed"
          ? 100
          : 0;


      res.json({

        status:
          orientationStatus,

        progress,

        email:

          obj["USM Email"] ||
          email,

        studentName:
          obj["Student Name"] || "",

        matricNo:
          obj["Matric No."] || "",

        programme:
          obj["Programme"] || "",

        studentType:
          obj["Student Type"] || "",

        completedAt:
          obj["Completion Date"] || "",

        ppbmsAccess:
          obj["PPBMS Access"] || "",

        systemIntroduction:
          obj["System Introduction"] || "",

        meetTheTeam:
          obj["Meet the Team"] || "",

        adusiswaReviewed:
          obj["AduSiswa Reviewed"] || "",

        handbookReviewed:
          obj["Handbook / Forms Reviewed"] || "",

        whatsappJoined:
          obj["WhatsApp Joined"] || "",

        shuttleReviewed:
          obj["Shuttle / Location Reviewed"] || "",

        dosDontsReviewed:
          obj["Do's & Don'ts Reviewed"] || "",

        assistanceRequired:
          obj["Assistance Required"] || "",

        assistanceDetails:
          obj["Assistance Details"] || ""

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


/* =========================================================
   COMPLETE ORIENTATION
========================================================= */

router.post(
  "/complete",
  auth,
  async (req, res) => {

    try {

      const email =
        req.user.email;


      const row =
        await findRow(email);


      /*
       * Student must already exist
       * in ORIENTATION_TRACKING.
       */

      if (!row) {

        return res.status(404).json({

          error:
            "Student is not found in ORIENTATION_TRACKING."

        });

      }


      const now =
        new Date().toISOString();


      /*
       * Update required tracking fields
       */

      await updateCell(
        row.sheets,
        row.headers,
        row.rowNumber,
        "Orientation Status",
        "Completed"
      );


      await updateCell(
        row.sheets,
        row.headers,
        row.rowNumber,
        "Completion Date",
        now
      );


      /*
       * PPBMS access already confirmed
       */

      await updateCell(
        row.sheets,
        row.headers,
        row.rowNumber,
        "PPBMS Access",
        "Completed"
      );


      /*
       * BAA notification status
       */

      let emailStatus =
        "Pending";


      /*
       * Notify Anis
       */

      try {

        await sendEmail({

          to:
            ANIS_EMAIL,

          subject:
            "PKTAAB Orientation Completed",

          text:
            `${email} has completed the PKTAAB Postgraduate Student Orientation.`,

          html: `
            <div style="
              font-family:Arial,sans-serif;
              line-height:1.6;
            ">

              <h2>
                🎓 PKTAAB Orientation Completed
              </h2>

              <p>
                A postgraduate student has completed
                the PKTAAB Postgraduate Student Orientation.
              </p>

              <p>
                <strong>Student Email:</strong>
                ${email}
              </p>

              <p>
                <strong>Completed:</strong>
                ${now}
              </p>

              <p>
                The student's orientation record has
                been updated in ORIENTATION_TRACKING.
              </p>

            </div>
          `

        });


        emailStatus =
          "Sent";


        await updateCell(
          row.sheets,
          row.headers,
          row.rowNumber,
          "BAA Notification",
          "Sent"
        );


      } catch (emailError) {

        console.error(
          "Orientation notification failed:",
          emailError
        );


        emailStatus =
          "Failed";


        try {

          await updateCell(
            row.sheets,
            row.headers,
            row.rowNumber,
            "BAA Notification",
            "Failed"
          );

        } catch (updateError) {

          console.error(
            "Unable to update BAA Notification:",
            updateError
          );

        }

      }


      /*
       * Final response
       */

      res.json({

        success:
          true,

        status:
          "Completed",

        progress:
          100,

        completedAt:
          now,

        emailNotification:
          emailStatus

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


export default router;
