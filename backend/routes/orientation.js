// ============================================================
// backend/routes/orientation.js
// PKTAAB POSTGRADUATE ORIENTATION
// ============================================================

import express from "express";
import jwt from "jsonwebtoken";
import { google } from "googleapis";

import {
  readMasterTracking,
} from "../services/googleSheets.js";

import sendEmail from "../services/sendEmail.js";

const router = express.Router();

/* ============================================================
   CONFIGURATION
============================================================ */

const ORIENTATION_SHEET_NAME = "ORIENTATION_TRACKING";
const ORIENTATION_RANGE = "A1:U999";

const ANIS_EMAIL = "anissyamimi@usm.my";

/*
  IMPORTANT:
  This spreadsheet ID is taken from the existing PPBMS
  environment variable.

  Do NOT hard-code the ID here.
*/
const SHEET_ID = process.env.SHEET_ID;


/* ============================================================
   GOOGLE SHEETS AUTH
============================================================ */

function getGoogleAuth(readonly = true) {

  const raw =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_JSON"
    );
  }

  const credentials =
    JSON.parse(raw);

  return new google.auth.GoogleAuth({
    credentials,

    scopes: readonly
      ? [
          "https://www.googleapis.com/auth/spreadsheets.readonly",
        ]
      : [
          "https://www.googleapis.com/auth/spreadsheets",
        ],
  });
}


/* ============================================================
   GOOGLE SHEETS CLIENT
============================================================ */

async function getSheetsClient(readonly = true) {

  if (!SHEET_ID) {
    throw new Error(
      "Missing SHEET_ID environment variable"
    );
  }

  const auth =
    getGoogleAuth(readonly);

  const client =
    await auth.getClient();

  return google.sheets({
    version: "v4",
    auth: client,
  });
}


/* ============================================================
   FIND EXACT ORIENTATION SHEET TAB
============================================================ */

async function getOrientationSheetTitle() {

  const sheets =
    await getSheetsClient(true);

  const response =
    await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,

      fields:
        "sheets.properties",
    });

  const availableSheets =
    response.data.sheets || [];

  const sheet =
    availableSheets.find((item) => {

      const title =
        String(
          item.properties?.title || ""
        )
          .trim()
          .toUpperCase();

      return (
        title ===
        ORIENTATION_SHEET_NAME
      );

    });

  if (!sheet) {

    const available =
      availableSheets
        .map(
          (item) =>
            item.properties?.title
        )
        .filter(Boolean)
        .join(", ");

    throw new Error(
      `ORIENTATION_TRACKING not found. Available sheets: ${available}`
    );
  }

  return (
    sheet.properties.title
  );
}


/* ============================================================
   SAFE SHEET TITLE
============================================================ */

function quoteSheetTitle(title) {

  return `'${String(title)
    .replace(/'/g, "''")}'`;

}


/* ============================================================
   READ ORIENTATION SHEET
============================================================ */

async function getOrientationSheet() {

  const sheets =
    await getSheetsClient(true);

  const sheetTitle =
    await getOrientationSheetTitle();

  const safeTitle =
    quoteSheetTitle(
      sheetTitle
    );

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        SHEET_ID,

      range:
        `${safeTitle}!${ORIENTATION_RANGE}`,

    });

  const values =
    response.data.values || [];

  if (
    values.length === 0
  ) {

    return {

      sheetTitle,

      headers: [],

      rows: [],

    };

  }

  const headers =
    values[0].map(
      (header) =>
        String(header || "")
          .trim()
    );

  const rows =
    values
      .slice(1)
      .map(
        (row, index) => {

          const obj = {};

          headers.forEach(
            (header, i) => {

              obj[header] =
                row[i] || "";

            }
          );

          /*
            Google Sheet row number.
            Header is row 1,
            first data row is row 2.
          */

          obj.__rowNumber =
            index + 2;

          return obj;

        }
      );

  return {

    sheetTitle,

    headers,

    rows,

  };

}


/* ============================================================
   FIND STUDENT ORIENTATION ROW
============================================================ */

function findOrientationRow(
  rows,
  email
) {

  const target =
    String(email || "")
      .trim()
      .toLowerCase();

  return rows.find(
    (row) => {

      const rowEmail =
        String(
          row["USM Email"] || ""
        )
          .trim()
          .toLowerCase();

      return (
        rowEmail === target
      );

    }
  );

}


/* ============================================================
   FIND STUDENT IN MASTER TRACKING
============================================================ */

async function findStudentInMasterTracking(
  email
) {

  const rows =
    await readMasterTracking(
      SHEET_ID
    );

  const target =
    String(email || "")
      .trim()
      .toLowerCase();

  const student =
    rows.find(
      (row) => {

        const studentEmail =
          String(
            row["Student's Email"] ||
              row["Student Email"] ||
              row["USM Email"] ||
              ""
          )
            .trim()
            .toLowerCase();

        return (
          studentEmail ===
          target
        );

      }
    );

  return student || null;

}


/* ============================================================
   CREATE NEW ORIENTATION ROW
============================================================ */

async function createOrientationRow(
  student
) {

  const sheets =
    await getSheetsClient(false);

  const sheetTitle =
    await getOrientationSheetTitle();

  const safeTitle =
    quoteSheetTitle(
      sheetTitle
    );

  const existingData =
    await getOrientationSheet();

  /*
    Index
  */

  const nextIndex =
    existingData.rows.length + 1;

  const timestamp =
    new Date().toISOString();

  const studentName =
    student["Student Name"] ||
    student["StudentName"] ||
    student["student_name"] ||
    "";

  const email =
    student["Student's Email"] ||
    student["Student Email"] ||
    student["USM Email"] ||
    "";

  const matric =
    student["Matric"] ||
    student["Matric No."] ||
    "";

  const programme =
    student["Programme"] ||
    "";

  const studentType =
    student["Student Type"] ||
    "";

  const values = [[

    nextIndex,

    timestamp,

    studentName,

    email,

    matric,

    programme,

    studentType,

    "Not Started",

    "Completed",

    "Pending",

    "Pending",

    "Pending",

    "Pending",

    "Pending",

    "Pending",

    "Pending",

    "No",

    "",

    "",

    "Pending",

    "Automatically created from MasterTracking",

  ]];

  /*
    A:U = 21 columns

    A  Index
    B  Timestamp
    C  Student Name
    D  USM Email
    E  Matric No.
    F  Programme
    G  Student Type
    H  Orientation Status
    I  PPBMS Access
    J  System Introduction
    K  Meet the Team
    L  AduSiswa Reviewed
    M  Handbook / Forms Reviewed
    N  WhatsApp Joined
    O  Shuttle / Location Reviewed
    P  Do's & Don'ts Reviewed
    Q  Assistance Required
    R  Assistance Details
    S  Completion Date
    T  BAA Notification
    U  Remarks
  */

  const response =
    await sheets.spreadsheets.values.append({

      spreadsheetId:
        SHEET_ID,

      range:
        `${safeTitle}!A:U`,

      valueInputOption:
        "USER_ENTERED",

      insertDataOption:
        "INSERT_ROWS",

      requestBody: {
        values,
      },

    });

  console.log(
    "Orientation row created:",
    response.data.updates
  );

  /*
    Re-read the sheet to obtain
    the actual row number.
  */

  const refreshed =
    await getOrientationSheet();

  const created =
    findOrientationRow(
      refreshed.rows,
      email
    );

  return created || null;

}


/* ============================================================
   ENSURE ORIENTATION ROW EXISTS
============================================================ */

async function ensureOrientationRow(
  email
) {

  const orientationData =
    await getOrientationSheet();

  let row =
    findOrientationRow(
      orientationData.rows,
      email
    );

  /*
    Already exists
  */

  if (row) {

    return {

      row,

      sheetTitle:
        orientationData.sheetTitle,

    };

  }

  /*
    Does not exist.
    Find student in MasterTracking.
  */

  const student =
    await findStudentInMasterTracking(
      email
    );

  if (!student) {

    throw new Error(
      `Student ${email} was not found in MasterTracking`
    );

  }

  row =
    await createOrientationRow(
      student
    );

  if (!row) {

    throw new Error(
      "Unable to create Orientation Tracking row"
    );

  }

  return {

    row,

    sheetTitle:
      orientationData.sheetTitle,

  };

}


/* ============================================================
   UPDATE ENTIRE ORIENTATION ROW
============================================================ */

async function updateOrientationRow(
  rowNumber,
  sheetTitle,
  updates
) {

  const sheets =
    await getSheetsClient(false);

  const safeTitle =
    quoteSheetTitle(
      sheetTitle
    );

  /*
    Read current row first.
  */

  const response =
    await sheets.spreadsheets.values.get({

      spreadsheetId:
        SHEET_ID,

      range:
        `${safeTitle}!A${rowNumber}:U${rowNumber}`,

    });

  const current =
    response.data.values?.[0] ||
    [];

  /*
    Ensure exactly 21 columns.
  */

  while (
    current.length < 21
  ) {

    current.push("");

  }

  /*
    Column indexes
  */

  const columnMap = {

    index: 0,

    timestamp: 1,

    "Student Name": 2,

    "USM Email": 3,

    "Matric No.": 4,

    Programme: 5,

    "Student Type": 6,

    "Orientation Status": 7,

    "PPBMS Access": 8,

    "System Introduction": 9,

    "Meet the Team": 10,

    "AduSiswa Reviewed": 11,

    "Handbook / Forms Reviewed": 12,

    "WhatsApp Joined": 13,

    "Shuttle / Location Reviewed": 14,

    "Do's & Don'ts Reviewed": 15,

    "Assistance Required": 16,

    "Assistance Details": 17,

    "Completion Date": 18,

    "BAA Notification": 19,

    Remarks: 20,

  };

  Object.entries(
    updates
  ).forEach(
    ([key, value]) => {

      const index =
        columnMap[key];

      if (
        index !== undefined
      ) {

        current[index] =
          value ?? "";

      }

    }
  );

  await sheets.spreadsheets.values.update({

    spreadsheetId:
      SHEET_ID,

    range:
      `${safeTitle}!A${rowNumber}:U${rowNumber}`,

    valueInputOption:
      "USER_ENTERED",

    requestBody: {

      values: [
        current.slice(0, 21)
      ],

    },

  });

}


/* ============================================================
   AUTHENTICATION
============================================================ */

function studentAuth(
  req,
  res,
  next
) {

  const authHeader =
    req.headers.authorization ||
    "";

  const token =
    authHeader.replace(
      /^Bearer\s+/i,
      ""
    ).trim();

  if (!token) {

    return res.status(401).json({

      error:
        "No authentication token",

    });

  }

  try {

    const user =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    /*
      Orientation is for students.
      Admin/supervisor can also be allowed
      if needed for testing/administration.
    */

    if (
      ![
        "student",
        "admin",
        "supervisor",
      ].includes(
        String(
          user.role || ""
        ).toLowerCase()
      )
    ) {

      return res.status(403).json({

        error:
          "Unauthorized role",

      });

    }

    req.user =
      user;

    next();

  } catch (error) {

    console.error(
      "Orientation authentication error:",
      error.message
    );

    return res.status(401).json({

      error:
        "Invalid or expired token",

    });

  }

}


/* ============================================================
   GET ORIENTATION STATUS
============================================================ */

router.get(
  "/status",
  studentAuth,
  async (req, res) => {

    try {

      const email =
        String(
          req.user.email ||
          req.user.Email ||
          ""
        )
          .trim()
          .toLowerCase();

      if (!email) {

        return res.status(400).json({

          error:
            "Student email not found in token",

        });

      }

      console.log(
        "Orientation status request:",
        email
      );

      const result =
        await ensureOrientationRow(
          email
        );

      const row =
        result.row;

      const completed =
        String(
          row[
            "Orientation Status"
          ] || ""
        )
          .trim()
          .toLowerCase() ===
        "completed";

      return res.json({

        success: true,

        status:
          row[
            "Orientation Status"
          ] || "Not Started",

        completed,

        progress: {

          ppbmsAccess:
            row["PPBMS Access"] ||
            "Pending",

          systemIntroduction:
            row[
              "System Introduction"
            ] || "Pending",

          meetTheTeam:
            row[
              "Meet the Team"
            ] || "Pending",

          aduSiswa:
            row[
              "AduSiswa Reviewed"
            ] || "Pending",

          handbook:
            row[
              "Handbook / Forms Reviewed"
            ] || "Pending",

          whatsapp:
            row[
              "WhatsApp Joined"
            ] || "Pending",

          shuttle:
            row[
              "Shuttle / Location Reviewed"
            ] || "Pending",

          dosDonts:
            row[
              "Do's & Don'ts Reviewed"
            ] || "Pending",

        },

        tracking: row,

      });

    } catch (error) {

      console.error(
        "Orientation status error:",
        error
      );

      return res.status(500).json({

        error:
          error.message ||
          "Unable to load orientation status",

      });

    }

  }
);


/* ============================================================
   COMPLETE ORIENTATION
============================================================ */

router.post(
  "/complete",
  studentAuth,
  async (req, res) => {

    try {

      const email =
        String(
          req.user.email ||
          req.user.Email ||
          ""
        )
          .trim()
          .toLowerCase();

      if (!email) {

        return res.status(400).json({

          error:
            "Student email not found",

        });

      }

      console.log(
        "Completing orientation:",
        email
      );

      const result =
        await ensureOrientationRow(
          email
        );

      const row =
        result.row;

      const sheetTitle =
        result.sheetTitle;

      /*
        Optional information sent by frontend.
      */

      const assistanceRequired =
        req.body?.assistanceRequired ??
        row[
          "Assistance Required"
        ] ??
        "No";

      const assistanceDetails =
        req.body?.assistanceDetails ??
        row[
          "Assistance Details"
        ] ??
        "";

      const completionDate =
        new Date().toISOString();

      /*
        Update all completion fields.
      */

      await updateOrientationRow(

        row.__rowNumber,

        sheetTitle,

        {

          "Orientation Status":
            "Completed",

          "PPBMS Access":
            "Completed",

          "System Introduction":
            "Completed",

          "Meet the Team":
            "Completed",

          "AduSiswa Reviewed":
            "Completed",

          "Handbook / Forms Reviewed":
            "Completed",

          "WhatsApp Joined":
            "Completed",

          "Shuttle / Location Reviewed":
            "Completed",

          "Do's & Don'ts Reviewed":
            "Completed",

          "Assistance Required":
            assistanceRequired,

          "Assistance Details":
            assistanceDetails,

          "Completion Date":
            completionDate,

          "BAA Notification":
            "Pending",

        }

      );

      /*
        Send notification email to Anis.
      */

      let notificationStatus =
        "Sent";

      try {

        const studentName =
          row["Student Name"] ||
          "Postgraduate Student";

        const matric =
          row["Matric No."] ||
          "";

        const programme =
          row["Programme"] ||
          "";

        await sendEmail({

          to:
            ANIS_EMAIL,

          subject:
            `PPBMS Orientation Completed – ${studentName}`,

          text:
            `
PKTAAB Postgraduate Orientation Completed

Student:
${studentName}

USM Email:
${email}

Matric No.:
${matric}

Programme:
${programme}

Orientation Status:
Completed

Completion Date:
${completionDate}

Assistance Required:
${assistanceRequired}

Assistance Details:
${assistanceDetails || "None"}

This notification was generated automatically by PPBMS.
            `.trim(),

          html:
            `
<div style="
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
">

  <h2 style="color:#53257f;">
    PKTAAB Postgraduate Orientation Completed
  </h2>

  <p>
    A postgraduate student has completed the
    PKTAAB Postgraduate Orientation.
  </p>

  <table
    style="
      border-collapse:collapse;
      width:100%;
      max-width:650px;
    "
  >

    <tr>
      <td style="padding:8px;font-weight:bold;">
        Student
      </td>
      <td style="padding:8px;">
        ${studentName}
      </td>
    </tr>

    <tr>
      <td style="padding:8px;font-weight:bold;">
        USM Email
      </td>
      <td style="padding:8px;">
        ${email}
      </td>
    </tr>

    <tr>
      <td style="padding:8px;font-weight:bold;">
        Matric No.
      </td>
      <td style="padding:8px;">
        ${matric}
      </td>
    </tr>

    <tr>
      <td style="padding:8px;font-weight:bold;">
        Programme
      </td>
      <td style="padding:8px;">
        ${programme}
      </td>
    </tr>

    <tr>
      <td style="padding:8px;font-weight:bold;">
        Completion Date
      </td>
      <td style="padding:8px;">
        ${completionDate}
      </td>
    </tr>

    <tr>
      <td style="padding:8px;font-weight:bold;">
        Assistance Required
      </td>
      <td style="padding:8px;">
        ${assistanceRequired}
      </td>
    </tr>

    <tr>
      <td style="padding:8px;font-weight:bold;">
        Assistance Details
      </td>
      <td style="padding:8px;">
        ${assistanceDetails || "None"}
      </td>
    </tr>

  </table>

  <p style="margin-top:20px;">
    This notification was generated automatically
    by the PPBMS Orientation System.
  </p>

</div>
            `,

        });

      } catch (emailError) {

        notificationStatus =
          "Failed";

        console.error(
          "Orientation email failed:",
          emailError
        );

      }

      /*
        Update notification status.
      */

      await updateOrientationRow(

        row.__rowNumber,

        sheetTitle,

        {

          "BAA Notification":
            notificationStatus,

        }

      );

      return res.json({

        success: true,

        status:
          "Completed",

        completed:
          true,

        notification:
          notificationStatus,

        message:
          "Orientation completed successfully.",

      });

    } catch (error) {

      console.error(
        "Complete orientation error:",
        error
      );

      return res.status(500).json({

        error:
          error.message ||
          "Unable to complete orientation",

      });

    }

  }
);


/* ============================================================
   TEST / DEBUG ENDPOINT
   GET /api/orientation/debug
============================================================ */

router.get(
  "/debug",
  studentAuth,
  async (req, res) => {

    try {

      const sheets =
        await getSheetsClient(true);

      const response =
        await sheets.spreadsheets.get({

          spreadsheetId:
            SHEET_ID,

          fields:
            "spreadsheetId,properties.title,sheets.properties",

        });

      const availableSheets =
        (
          response.data.sheets ||
          []
        ).map(
          (sheet) => ({
            title:
              sheet.properties?.title,

            sheetId:
              sheet.properties?.sheetId,

          })
        );

      return res.json({

        success: true,

        spreadsheetId:
          response.data.spreadsheetId,

        spreadsheetTitle:
          response.data.properties?.title,

        orientationSheetFound:
          availableSheets.some(
            (sheet) =>
              String(
                sheet.title || ""
              )
                .trim()
                .toUpperCase() ===
              ORIENTATION_SHEET_NAME
          ),

        availableSheets,

      });

    } catch (error) {

      console.error(
        "Orientation debug error:",
        error
      );

      return res.status(500).json({

        success: false,

        error:
          error.message,

      });

    }

  }
);


/* ============================================================
   EXPORT ROUTER
============================================================ */

export default router;
