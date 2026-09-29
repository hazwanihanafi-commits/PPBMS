import express from "express";
import jwt from "jsonwebtoken";
import { google } from "googleapis";

import sendEmail from "../services/sendEmail.js";
import { readMasterTracking } from "../services/googleSheets.js";

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

    req.user = jwt.verify(
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
   READ ORIENTATION TRACKING
========================================================= */

async function getOrientationSheet() {

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
      h => String(h || "").trim()
    );

  return {
    sheets,
    headers,
    rows: values.slice(1)
  };

}


/* =========================================================
   FIND EXISTING ORIENTATION ROW
========================================================= */

async function findRow(email) {

  const data =
    await getOrientationSheet();

  const emailIndex =
    data.headers.indexOf(
      "USM Email"
    );

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
    data.rows.findIndex(
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


  return {

    sheets:
      data.sheets,

    rowNumber:
      rowIndex + 2,

    headers:
      data.headers,

    values:
      data.rows[rowIndex]

  };

}


/* =========================================================
   CREATE ORIENTATION ROW AUTOMATICALLY
   FROM MASTER TRACKING
========================================================= */

async function ensureOrientationRow(email) {

  // First check Orientation Tracking
  const existing =
    await findRow(email);

  if (existing) {

    return existing;

  }


  /*
   * Student does not have an Orientation row yet.
   *
   * Find them in MasterTracking.
   */

  const masterRows =
    await readMasterTracking(
      process.env.SHEET_ID
    );


  const targetEmail =
    String(email || "")
      .trim()
      .toLowerCase();


  const student =
    masterRows.find(
      row =>
        String(
          row["Student's Email"] || ""
        )
          .trim()
          .toLowerCase() ===
        targetEmail
    );


  if (!student) {

    throw new Error(
      `Student ${email} was not found in MasterTracking`
    );

  }


  /*
   * Get current Orientation headers
   */

  const data =
    await getOrientationSheet();


  const headers =
    data.headers;


  /*
   * Determine next Index
   */

  let nextIndex = 1;


  const indexColumn =
    headers.indexOf("Index");


  if (indexColumn !== -1) {

    const existingIndexes =
      data.rows
        .map(
          row =>
            Number(
              row[indexColumn]
            )
        )
        .filter(
          value =>
            !Number.isNaN(value)
        );


    if (existingIndexes.length) {

      nextIndex =
        Math.max(
          ...existingIndexes
        ) + 1;

    }

  }


  /*
   * Create a row based on the exact
   * ORIENTATION_TRACKING headers.
   */

  const newRow =
    headers.map(
      header => {

        switch (header) {

          case "Index":
            return nextIndex;

          case "Timestamp":
            return new Date().toISOString();

          case "Student Name":
            return (
              student["Student Name"] ||
              ""
            );

          case "USM Email":
            return (
              student["Student's Email"] ||
              email
            );

          case "Matric No.":
            return (
              student["Matric"] ||
              student["Matric No"] ||
              ""
            );

          case "Programme":
            return (
              student["Programme"] ||
              ""
            );

          case "Student Type":
            return (
              student["Student Type"] ||
              ""
            );

          case "Orientation Status":
            return "Not Started";

          case "PPBMS Access":
            return "Completed";

          case "System Introduction":
            return "Pending";

          case "Meet the Team":
            return "Pending";

          case "AduSiswa Reviewed":
            return "Pending";

          case "Handbook / Forms Reviewed":
            return "Pending";

          case "WhatsApp Joined":
            return "Pending";

          case "Shuttle / Location Reviewed":
            return "Pending";

          case "Do's & Don'ts Reviewed":
            return "Pending";

          case "Assistance Required":
            return "No";

          case "Assistance Details":
            return "";

          case "Completion Date":
            return "";

          case "BAA Notification":
            return "Pending";

          case "Remarks":
            return "Automatically created from MasterTracking";

          default:
            return "";

        }

      }
    );


  /*
   * Append the new student
   */

  await data.sheets.spreadsheets.values.append({

    spreadsheetId:
      process.env.SHEET_ID,

    range:
      `${SHEET_NAME}!A:U`,

    valueInputOption:
      "USER_ENTERED",

    insertDataOption:
      "INSERT_ROWS",

    requestBody: {
      values: [
        newRow
      ]
    }

  });


  /*
   * Read the newly-created row
   * so we have its real row number.
   */

  const created =
    await findRow(email);


  if (!created) {

    throw new Error(
      "Orientation row was created but could not be retrieved."
    );

  }


  console.log(
    "🎓 Orientation row automatically created:",
    {
      email,
      studentName:
        student["Student Name"],
      matric:
        student["Matric"],
      programme:
        student["Programme"]
    }
  );


  return created;

}


/* =========================================================
   ROW → OBJECT
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
   COLUMN INDEX
========================================================= */

function getColumnIndex(
  headers,
  columnName
) {

  const index =
    headers.indexOf(
      columnName
    );

  if (index === -1) {

    throw new Error(
      `Column "${columnName}" not found in ${SHEET_NAME}`
    );

  }

  return index;

}


/* =========================================================
   COLUMN INDEX → LETTER
========================================================= */

function columnLetter(
  columnIndex
) {

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

  return column;

}


/* =========================================================
   UPDATE CELL
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
   GET ORIENTATION STATUS
========================================================= */

router.get(
  "/status",
  auth,
  async (req, res) => {

    try {

      const email =
        req.user.email;


      /*
       * ⭐ IMPORTANT:
       * Automatically create the row
       * if student is in MasterTracking.
       */

      const row =
        await ensureOrientationRow(
          email
        );


      const obj =
        rowToObject(row);


      const orientationStatus =
        obj["Orientation Status"] ||
        "Not Started";


      const progress =
        orientationStatus === "Completed"
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
          error.message ||
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


      /*
       * Automatically create the row
       * if it somehow does not exist.
       */

      const row =
        await ensureOrientationRow(
          email
        );


      const sheets =
        row.sheets;


      const now =
        new Date().toISOString();


      /*
       * Update completion
       */

      await updateCell(
        sheets,
        row.headers,
        row.rowNumber,
        "Orientation Status",
        "Completed"
      );


      await updateCell(
        sheets,
        row.headers,
        row.rowNumber,
        "Completion Date",
        now
      );


      await updateCell(
        sheets,
        row.headers,
        row.rowNumber,
        "PPBMS Access",
        "Completed"
      );


      /*
       * Optional data sent from frontend
       */

      const payload =
        req.body || {};


      if (
        payload.assistanceRequired
      ) {

        await updateCell(
          sheets,
          row.headers,
          row.rowNumber,
          "Assistance Required",
          payload.assistanceRequired
        );

      }


      if (
        payload.assistanceDetails
      ) {

        await updateCell(
          sheets,
          row.headers,
          row.rowNumber,
          "Assistance Details",
          payload.assistanceDetails
        );

      }


      /*
       * Notify BAA / Anis
       */

      let emailStatus =
        "Pending";


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
                been updated automatically.
              </p>

            </div>
          `

        });


        emailStatus =
          "Sent";


        await updateCell(
          sheets,
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
            sheets,
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
          error.message ||
          "Unable to complete orientation"

      });

    }

  }
);


export default router;
